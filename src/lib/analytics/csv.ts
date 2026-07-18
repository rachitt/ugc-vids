export type MetricPlatform = "tiktok" | "instagram" | "youtube";

export type ParsedPostMetricRow = {
  contentItemId: string;
  platform: MetricPlatform;
  views: number;
  likes: number;
  comments: number;
  capturedAt?: Date;
};

export type CsvParseResult = {
  rows: ParsedPostMetricRow[];
  errors: string[];
};

type MetricHeader =
  | "contentItemId"
  | "platform"
  | "views"
  | "likes"
  | "comments"
  | "capturedAt";

const defaultColumnOrder: MetricHeader[] = [
  "contentItemId",
  "platform",
  "views",
  "likes",
  "comments",
  "capturedAt",
];

export function normalizeMetricPlatform(value: string): MetricPlatform | null {
  const normalized = value.trim().toLowerCase();

  if (normalized === "tiktok" || normalized === "tik_tok") {
    return "tiktok";
  }

  if (
    normalized === "instagram" ||
    normalized === "ig" ||
    normalized === "reels" ||
    normalized === "instagram_reels"
  ) {
    return "instagram";
  }

  if (
    normalized === "youtube" ||
    normalized === "yt" ||
    normalized === "shorts" ||
    normalized === "youtube_shorts"
  ) {
    return "youtube";
  }

  return null;
}

export function parseNonNegativeMetric(value: string, fieldName: string) {
  const normalized = value.trim().replaceAll(",", "");

  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be a non-negative whole number`);
  }

  const parsed = Number(normalized);

  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${fieldName} is too large`);
  }

  return parsed;
}

export function parsePostMetricsCsv(csvText: string): CsvParseResult {
  const rawRows = parseCsvRows(csvText).filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  );

  if (rawRows.length === 0) {
    return { rows: [], errors: ["CSV is empty"] };
  }

  const headerMap = getHeaderMap(rawRows[0]);
  const hasHeader = headerMap !== null;
  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  const rows: ParsedPostMetricRow[] = [];
  const errors: string[] = [];

  dataRows.forEach((row, index) => {
    const lineNumber = index + (hasHeader ? 2 : 1);

    try {
      rows.push(readMetricRow(row, headerMap));
    } catch (error) {
      errors.push(
        `Line ${lineNumber}: ${
          error instanceof Error ? error.message : "could not parse row"
        }`,
      );
    }
  });

  return { rows, errors };
}

function parseCsvRows(csvText: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const nextChar = csvText[index + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    if (char !== "\r") {
      field += char;
    }
  }

  if (inQuotes) {
    rows.push([...row, field]);
    return rows;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function getHeaderMap(row: string[]) {
  const mappedHeaders = row.map((cell) => toMetricHeader(cell));
  const hasRequiredHeader =
    mappedHeaders.includes("contentItemId") && mappedHeaders.includes("views");

  if (!hasRequiredHeader) {
    return null;
  }

  return mappedHeaders.reduce<Partial<Record<MetricHeader, number>>>(
    (headers, header, index) => {
      if (header && headers[header] === undefined) {
        headers[header] = index;
      }

      return headers;
    },
    {},
  );
}

function toMetricHeader(value: string): MetricHeader | null {
  const normalized = value.trim().toLowerCase().replaceAll(/[\s-]/g, "_");

  if (
    normalized === "content_item_id" ||
    normalized === "contentitemid" ||
    normalized === "item_id" ||
    normalized === "content_id"
  ) {
    return "contentItemId";
  }

  if (normalized === "platform") {
    return "platform";
  }

  if (normalized === "views" || normalized === "view_count") {
    return "views";
  }

  if (normalized === "likes" || normalized === "like_count") {
    return "likes";
  }

  if (normalized === "comments" || normalized === "comment_count") {
    return "comments";
  }

  if (
    normalized === "captured_at" ||
    normalized === "capturedat" ||
    normalized === "date"
  ) {
    return "capturedAt";
  }

  return null;
}

function readMetricRow(
  row: string[],
  headerMap: Partial<Record<MetricHeader, number>> | null,
): ParsedPostMetricRow {
  const contentItemId = readColumn(row, headerMap, "contentItemId").trim();
  const platform = normalizeMetricPlatform(
    readColumn(row, headerMap, "platform"),
  );

  if (!contentItemId) {
    throw new Error("content_item_id is required");
  }

  if (!platform) {
    throw new Error(
      "platform must be tiktok, instagram/reels, or youtube/shorts",
    );
  }

  const views = parseNonNegativeMetric(
    readColumn(row, headerMap, "views"),
    "views",
  );
  const likes = parseNonNegativeMetric(
    readColumn(row, headerMap, "likes"),
    "likes",
  );
  const comments = parseNonNegativeMetric(
    readColumn(row, headerMap, "comments"),
    "comments",
  );
  const capturedAtText = readColumn(row, headerMap, "capturedAt").trim();
  const capturedAt = capturedAtText ? new Date(capturedAtText) : undefined;

  if (capturedAtText && Number.isNaN(capturedAt?.getTime())) {
    throw new Error("captured_at must be a valid date");
  }

  if (row.length < 5) {
    throw new Error(`expected at least 5 columns, received ${row.length}`);
  }

  return {
    contentItemId,
    platform,
    views,
    likes,
    comments,
    capturedAt,
  };
}

function readColumn(
  row: string[],
  headerMap: Partial<Record<MetricHeader, number>> | null,
  header: MetricHeader,
) {
  const index = headerMap?.[header] ?? defaultColumnOrder.indexOf(header);

  return row[index] ?? "";
}
