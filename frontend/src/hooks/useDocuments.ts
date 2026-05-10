import { useState, useCallback, useRef, useEffect } from "react";
import { Document } from "../lib/types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem("rag_documents");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("rag_documents", JSON.stringify(documents));
  }, [documents]);

  // Ensure absolute transparency with Qdrant vector store
  useEffect(() => {
    fetch("/documents")
      .then(res => res.json())
      .then(data => {
        if (data.documents && Array.isArray(data.documents)) {
          setDocuments(prev => {
            return prev.filter(d => d.status === "Uploading" || data.documents.includes(d.name));
          });
        }
      })
      .catch(console.error);
  }, []);
  const [isDragging, setIsDragging] = useState(false);

  const addDocument = useCallback((file: File) => {
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "txt";

    const newDoc: Document = {
      id: docId,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      status: "Uploading",
      type: fileExtension as any,
      progress: 0,
    };

    setDocuments((prev) => [newDoc, ...prev]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileId", docId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload", true);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        // Ensure progress visually stops at 99% until processing is fully done
        const displayProgress = percentComplete === 100 ? 99 : percentComplete;
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, progress: displayProgress } : d))
        );
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: "Ready", progress: undefined } : d))
        );
      } else {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, status: "Error", progress: undefined } : d))
        );
      }
    };

    xhr.onerror = () => {
      console.error("Upload failed");
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: "Error", progress: undefined } : d))
      );
    };

    xhr.send(formData);
  }, []);

  const removeDocument = useCallback((id: string) => {
    const docToDelete = documents.find((d) => d.id === id);
    if (!docToDelete) return;
    
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    
    fetch("/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: docToDelete.id, fileName: docToDelete.name }),
    }).catch((err) => {
      console.error(err);
      setDocuments((prev) => [docToDelete, ...prev]);
    });
  }, [documents]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach((file) => addDocument(file));
      }
    },
    [addDocument]
  );

  return {
    documents,
    isDragging,
    addDocument,
    removeDocument,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
