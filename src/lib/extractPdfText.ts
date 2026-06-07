import { inflateRawSync } from "zlib";

function decodePDFString(str: string): string {
  str = str.trim();
  if (str.startsWith("<") && str.endsWith(">")) {
    const hex = str.slice(1, -1);
    const bytes = hex.match(/.{1,2}/g) || [];
    return bytes.map((b) => String.fromCharCode(parseInt(b, 16))).join("");
  }
  if (str.startsWith("(")) {
    let depth = 0;
    let result = "";
    for (let i = 1; i < str.length - 1; i++) {
      const c = str[i];
      if (c === "\\") {
        const next = str[++i];
        const escapes: Record<string, string> = {
          n: "\n", r: "\r", t: "\t",
          "(": "(", ")": ")", "\\": "\\",
        };
        if (next in escapes) result += escapes[next];
        else if (/^\d{3}$/.test(str.slice(i, i + 3))) {
          result += String.fromCharCode(parseInt(str.slice(i, i + 3), 8));
          i += 2;
        } else result += next;
      } else if (c === "(") { depth++; result += c; }
      else if (c === ")") { if (depth === 0) break; depth--; result += c; }
      else result += c;
    }
    return result;
  }
  return str;
}

function extractTextFromContent(content: string): string[] {
  const texts: string[] = [];

  // Match TJ text arrays with balanced brackets
  let idx = 0;
  while (idx < content.length) {
    const openBracket = content.indexOf("[", idx);
    if (openBracket === -1) break;

    // Look ahead for TJ after the bracket
    const closeBracket = findMatchingBracket(content, openBracket);
    if (closeBracket === -1) { idx = openBracket + 1; continue; }

    const afterBracket = content.slice(closeBracket + 1).match(/^\s*TJ/);
    if (afterBracket) {
      const inner = content.slice(openBracket + 1, closeBracket);
      const strRegex = /<([^>]*)>|\(((?:[^\\()]|\\.)*)\)/g;
      let sm;
      const parts: string[] = [];
      while ((sm = strRegex.exec(inner)) !== null) {
        const raw = sm[1] !== undefined ? `<${sm[1]}>` : `(${sm[2]})`;
        parts.push(decodePDFString(raw));
      }
      if (parts.length) texts.push(parts.join(""));
    }
    idx = closeBracket + 1;
  }

  // Match single Tj, ', " operators
  const singleRegex = /(<[^>]*>|\((?:[^\\()]|\\.)*\))\s*(Tj|'|")/g;
  let match;
  while ((match = singleRegex.exec(content)) !== null) {
    texts.push(decodePDFString(match[1]));
  }

  return texts;
}

function findMatchingBracket(str: string, openIdx: number): number {
  let depth = 1;
  for (let i = openIdx + 1; i < str.length; i++) {
    if (str[i] === "[") depth++;
    else if (str[i] === "]") { depth--; if (depth === 0) return i; }
  }
  return -1;
}

function decompressStream(data: Buffer): Buffer {
  try { return inflateRawSync(data); }
  catch {
    try { return inflateRawSync(data.slice(2)); }
    catch { throw new Error("decompress failed"); }
  }
}

function getFilters(header: string): string[] {
  // Array format first: /Filter [/FlateDecode /ASCIIHexDecode]
  const array = header.match(/\/Filter\s*\[([^\]]+)\]/);
  if (array) {
    return array[1].match(/\/\w+/g)?.map((f) => f.slice(1)) || [];
  }
  // Single filter: /Filter/FlateDecode or /Filter /FlateDecode
  const single = header.match(/\/Filter\/*\s*(\/\w+)/);
  if (single) return [single[1].slice(1)];

  return [];
}

function decodeASCIIHex(data: Buffer): Buffer {
  const str = data.toString("ascii").replace(/\s/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < str.length - 1; i += 2) {
    bytes.push(parseInt(str.slice(i, i + 2), 16));
  }
  return Buffer.from(bytes);
}

function decodeASCII85(data: Buffer): Buffer {
  let str = data.toString("ascii");
  // Remove whitespace
  str = str.replace(/\s/g, "");
  // Remove ~> end-of-data marker and anything after
  const endIdx = str.indexOf("~>");
  if (endIdx !== -1) str = str.slice(0, endIdx);

  const bytes: number[] = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === "z") {
      bytes.push(0, 0, 0, 0);
      i++;
      continue;
    }
    const chunk = str.slice(i, i + 5);
    if (chunk.length < 5) break;
    let code = 0;
    for (let j = 0; j < 5; j++) {
      code = code * 85 + (chunk.charCodeAt(j) - 33);
    }
    bytes.push(
      (code >>> 24) & 0xff,
      (code >>> 16) & 0xff,
      (code >>> 8) & 0xff,
      code & 0xff,
    );
    i += 5;
  }
  // Handle trailing partial group (last group may be <5 chars)
  if (i < str.length) {
    const chunk = str.slice(i);
    if (chunk.length >= 2) {
      // Pad with 'u' (value 84)
      const padded = chunk.padEnd(5, "u");
      let code = 0;
      for (let j = 0; j < 5; j++) {
        code = code * 85 + (padded.charCodeAt(j) - 33);
      }
      // Only take the bytes that were actually encoded
      const outLen = chunk.length - 1;
      for (let j = 0; j < outLen; j++) {
        bytes.push((code >>> (24 - j * 8)) & 0xff);
      }
    }
  }
  return Buffer.from(bytes);
}

function extractRawReadableText(data: Buffer): string {
  const str = data.toString("utf-8");
  const words: string[] = [];
  const wordRegex = /[A-Za-z]{3,}/g;
  let m;
  while ((m = wordRegex.exec(str)) !== null) {
    words.push(m[0]);
  }
  return words.join(" ");
}

export function extractPdfText(buffer: Buffer): string {
  const textPieces: string[] = [];
  const raw = buffer.toString("binary");

  // Find all stream...endstream pairs
  const streamRegex = /(\d+\s+\d+\s+obj[\s\S]*?)?stream[\r\n]+([\s\S]*?)endstream/g;
  let match;

  while ((match = streamRegex.exec(raw)) !== null) {
    const header = match[1] || "";
    let data = Buffer.from(match[2], "binary");

    while (data.length > 0 && (data[data.length - 1] === 10 || data[data.length - 1] === 13)) {
      data = data.subarray(0, -1);
    }

    // Skip font program streams (Type1, TrueType, CID fonts)
    if (/\/Length1\b|\/FontFile[23]?\b/.test(header)) continue;

    const filters = getFilters(header);

    let content: Buffer = data;
    let decodeOk = true;

    for (const filter of filters) {
      if (filter === "FlateDecode") {
        try { content = decompressStream(content); }
        catch { decodeOk = false; break; }
      } else if (filter === "ASCIIHexDecode") {
        content = decodeASCIIHex(content);
      } else if (filter === "ASCII85Decode") {
        content = decodeASCII85(content);
      }
    }

    if (!decodeOk) continue;

    const contentStr = content.toString("utf-8");
    const texts = extractTextFromContent(contentStr);
    textPieces.push(...texts);

    // Fallback: only on page content streams (have BT marker)
    // Font descriptors, CMap tables, annotations are skipped here
    if (texts.length === 0 && contentStr.includes("BT")) {
      const rawText = extractRawReadableText(content);
      if (rawText) textPieces.push(rawText);
    }
  }

  const result = textPieces.join(" ").replace(/\0/g, "");

  // Final fallback: scan entire PDF for readable text
  if (!result.trim()) {
    const rawText = extractRawReadableText(buffer);
    return rawText.replace(/\0/g, "");
  }

  return result;
}
