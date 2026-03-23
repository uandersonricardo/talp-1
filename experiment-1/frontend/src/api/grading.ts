import { apiFetchBlob, downloadBlob } from "./client";

export async function gradeResponses(
  answersFile: File,
  responsesFile: File,
  mode: "strict" | "lenient",
): Promise<void> {
  const formData = new FormData();
  formData.append("answers", answersFile);
  formData.append("responses", responsesFile);
  formData.append("mode", mode);

  const { blob, filename } = await apiFetchBlob("/api/grade", {
    method: "POST",
    body: formData,
  });

  downloadBlob(blob, filename || "report.csv");
}
