import { useMemo, useRef, useState, type CSSProperties } from "react";
import { API_BASE } from "../../../lib/api";
import { getAuthHeaders } from "../../auth/authStore";
import type { Course } from "../academyStore";

type LectureUploadPanelProps = {
  courses: Course[];
  onUploaded?: () => void;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  duration?: number;
  public_id?: string;
};

function buildFileName(title: string, fileName: string) {
  const cleanTitle = title.trim().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "");
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()}` : ".mp4";
  return `${cleanTitle || "lecture"}${extension}`;
}

export default function LectureUploadPanel({ courses, onUploaded }: LectureUploadPanelProps) {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id ?? "");
  const [lectureTitle, setLectureTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const resetForm = () => {
    setLectureTitle("");
    setFile(null);
    setProgress(0);
    setError(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const uploadToCloudinary = async (selectedFile: File, signature: { apiKey: string; timestamp: number; signature: string; folder: string; cloudName: string }) => {
    const form = new FormData();
    form.append("file", selectedFile);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("folder", `${signature.folder}/lectures`);

    return await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (!event.lengthComputable) return;
        setProgress(Math.round((event.loaded / event.total) * 100));
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResponse);
          } catch {
            reject(new Error("Failed to parse Cloudinary response"));
          }
          return;
        }

        reject(new Error("Cloudinary upload failed"));
      });

      xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`);
      xhr.send(form);
    });
  };

  const handleUpload = async () => {
    if (!selectedCourseId) {
      setError("Choose a course first.");
      return;
    }

    if (!file) {
      setError("Choose a video file first.");
      return;
    }

    if (!lectureTitle.trim()) {
      setError("Add a lecture title.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    let lectureId: string | null = null;

    try {
      const createResponse = await fetch(`${API_BASE}/lecture-uploads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          courseId: selectedCourseId,
          fileName: buildFileName(lectureTitle, file.name),
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create lecture record");
      }

      const lecture = (await createResponse.json()) as { id: string };
      lectureId = lecture.id;

      const signatureResponse = await fetch(`${API_BASE}/lecture-uploads/signature`, {
        headers: getAuthHeaders(),
      });

      if (!signatureResponse.ok) {
        throw new Error("Failed to fetch Cloudinary signature");
      }

      const signature = (await signatureResponse.json()) as {
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
        cloudName: string;
      };

      const uploadResponse = await uploadToCloudinary(file, signature);
      const secureUrl = uploadResponse.secure_url;

      if (!secureUrl) {
        throw new Error("Cloudinary did not return a secure URL");
      }

      const attachResponse = await fetch(`${API_BASE}/lecture-uploads/${lectureId}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          cloudinaryUrl: secureUrl,
          durationSecs: typeof uploadResponse.duration === "number" ? Math.round(uploadResponse.duration) : undefined,
        }),
      });

      if (!attachResponse.ok) {
        throw new Error("Failed to attach uploaded video to lecture");
      }

      setSuccess(`Uploaded ${lectureTitle.trim()} to ${selectedCourse?.title ?? "course"}.`);
      resetForm();
      onUploaded?.();
    } catch (uploadError) {
      if (lectureId) {
        void fetch(`${API_BASE}/lecture-uploads/${lectureId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
      }

      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={styles.label}>Lecture Uploads</div>
          <div style={styles.title}>Cloudinary video workflow</div>
        </div>
        <div style={styles.badge}>{selectedCourse ? selectedCourse.title : "No course selected"}</div>
      </div>

      <div style={styles.grid}>
        <label style={styles.field}>
          <span style={styles.fieldLabel}>Course</span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={styles.select}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>Lecture Title</span>
          <input
            value={lectureTitle}
            onChange={(e) => setLectureTitle(e.target.value)}
            placeholder="e.g. Lesson 1 - Brand Story"
            style={styles.input}
          />
        </label>

        <label style={styles.field}>
          <span style={styles.fieldLabel}>Video File</span>
          <div style={styles.dropZone} onClick={() => fileRef.current?.click()}>
            <div style={styles.dropTitle}>{file ? file.name : "Click to choose a video"}</div>
            <div style={styles.dropHint}>MP4, MOV, WebM · uploads directly to Cloudinary</div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            hidden
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setFile(nextFile);
              setError(null);
            }}
          />
        </label>
      </div>

      {uploading ? (
        <div style={styles.progressWrap}>
          <div style={styles.progressLabel}>{`Uploading ${progress}%`}</div>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {error ? <div style={styles.error}>{error}</div> : null}
      {success ? <div style={styles.success}>{success}</div> : null}

      <button type="button" onClick={() => void handleUpload()} disabled={uploading} style={styles.button}>
        {uploading ? "Uploading..." : "Upload Lecture"}
      </button>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: 18,
    display: "grid",
    gap: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  label: {
    fontFamily: "Space Mono, monospace",
    fontSize: 10,
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Syne, sans-serif",
    fontSize: 18,
    fontWeight: 700,
    color: "var(--text)",
  },
  badge: {
    fontFamily: "Space Mono, monospace",
    fontSize: 10,
    color: "var(--ice)",
    border: "1px solid rgba(137,196,225,0.2)",
    background: "rgba(137,196,225,0.08)",
    padding: "6px 10px",
    borderRadius: 999,
  },
  grid: {
    display: "grid",
    gap: 12,
  },
  field: {
    display: "grid",
    gap: 6,
  },
  fieldLabel: {
    fontFamily: "Space Mono, monospace",
    fontSize: 10,
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  select: {
    background: "var(--surface2)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    minHeight: 42,
    padding: "0 12px",
  },
  input: {
    background: "var(--surface2)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    minHeight: 42,
    padding: "0 12px",
  },
  dropZone: {
    minHeight: 88,
    border: "1px dashed var(--border)",
    borderRadius: 6,
    background: "var(--surface2)",
    display: "grid",
    placeItems: "center",
    padding: 12,
    cursor: "pointer",
  },
  dropTitle: {
    color: "var(--text)",
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
  },
  dropHint: {
    color: "var(--text-dim)",
    fontFamily: "Space Mono, monospace",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
  progressWrap: {
    display: "grid",
    gap: 8,
  },
  progressLabel: {
    color: "var(--ice)",
    fontFamily: "Space Mono, monospace",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  progressBar: {
    height: 4,
    background: "var(--border)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "var(--ice)",
  },
  error: {
    color: "var(--red)",
    fontFamily: "Space Mono, monospace",
    fontSize: 11,
  },
  success: {
    color: "var(--green)",
    fontFamily: "Space Mono, monospace",
    fontSize: 11,
  },
  button: {
    minHeight: 44,
    border: "none",
    borderRadius: 6,
    background: "var(--gold)",
    color: "var(--bg)",
    fontFamily: "Space Mono, monospace",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    cursor: "pointer",
  },
};
