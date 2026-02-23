export interface UnitDueDateHistory {
  id?: number;             // auto-increment PK
  unitKey: string;         // FK → Unit.jiraKey
  previousDueDate: string; // 변경 전 값 ("" = 없었음)
  newDueDate: string;      // 변경 후 값 ("" = 삭제됨)
  detectedAt: string;      // 변경 감지 시각 (ISO 8601 KST)
}
