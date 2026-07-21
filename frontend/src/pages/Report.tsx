import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useScanStore } from "../store/scan-store";
import { apiClient } from "../lib/api-client";
import { RiskTreemap } from "../components/treemap/RiskTreemap";
import { RankedList } from "../components/ranked-list/RankedList";
import { FileDetailPanel } from "../components/file-detail/FileDetailPanel";
import React from "react";

export const Report = () => {
  const { scanId, slug } = useParams<{ scanId?: string; slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const setFileScores = useScanStore((state) => state.setFileScores);
  const setScanMeta = useScanStore((state) => state.setScanMeta);
  const selectedFilePath = useScanStore((state) => state.selectedFilePath);
  const scanMeta = useScanStore((state) => state.scanMeta);

  console.log("REPO: ", scanMeta?.repo);

  // const setSelectedFilePath = useScanStore(
  //   (state) => state.setSelectedFilePath,
  // );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isInitialMount = React.useRef(true);

  // Sync Store -> URL search params (Push state on user interaction)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const fileParam = searchParams.get("file");
      if (fileParam) {
        useScanStore.getState().setSelectedFilePath(fileParam);
      }
      return;
    }

    const currentParam = searchParams.get("file");
    if (selectedFilePath !== currentParam) {
      if (selectedFilePath) {
        setSearchParams({ file: selectedFilePath }); // Push state!
      } else if (currentParam) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("file");
        setSearchParams(nextParams); // Push state!
      }
    }
  }, [selectedFilePath]);

  // Sync URL search params -> store (Handle Back/Forward buttons)
  useEffect(() => {
    const fileParam = searchParams.get("file");
    if (fileParam !== useScanStore.getState().selectedFilePath) {
      useScanStore.getState().setSelectedFilePath(fileParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    if (scanId || slug) {
      setLoading(true);
      const metaUrl = slug ? `/reports/shared/${slug}` : `/scans/${scanId}`;
      const filesUrl = slug
        ? `/reports/shared/${slug}/files`
        : `/scans/${scanId}/files`;

      Promise.all([apiClient.get(metaUrl), apiClient.get(filesUrl)])
        .then(([metaRes, filesRes]) => {
          if (isMounted) {
            setScanMeta(metaRes.data);

            // Handle both new API format (object) and old format (array fallback just in case)
            if (filesRes.data.fileScores) {
              setFileScores(filesRes.data.fileScores);
              if (filesRes.data.dependencies) {
                useScanStore
                  .getState()
                  .setDependencies(filesRes.data.dependencies);
              }
            } else {
              setFileScores(filesRes.data);
            }

            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load scan data", err);
          if (isMounted) {
            setError("Failed to load report data.");
            setLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
      useScanStore.getState().resetScanState();
    };
  }, [scanId, slug, setFileScores]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas">
        <p className="font-mono text-sm text-mute animate-pulse">
          Loading report data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-canvas gap-4">
        <p className="font-sans text-body">{error}</p>
        <Link to="/" className="text-link hover:text-ink text-sm font-medium">
          Return Home
        </Link>
      </div>
    );
  }

  const handleExportCsv = async () => {
    try {
      const res = await apiClient.get(`/reports/${scanId}/csv`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `cartograph-report-${scanId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Failed to export CSV", err);
      alert("Failed to export CSV. You might not have permission.");
    }
  };

  const handleShareLink = async () => {
    try {
      const res = await apiClient.post(`/reports/${scanId}/link`);
      const slug = res.data.url;
      const shareUrl = `${window.location.origin}/shared/${slug}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("Shareable link copied to clipboard!");
    } catch (err) {
      console.error("Failed to create shareable link", err);
      alert("Failed to create shareable link. You might not have permission.");
    }
  };

  // const handlePrintPdf = () => {
  //   const baseUrl = apiClient.defaults.baseURL || "http://localhost:4000/api";
  //   const pdfUrl = slug
  //     ? `${baseUrl}/reports/shared/${slug}/pdf`
  //     : `${baseUrl}/reports/${scanId}/pdf`;
  //   window.open(pdfUrl, "_blank");
  // };

  return (
    <div className="h-screen w-screen p-6 flex flex-col bg-canvas text-ink overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-medium tracking-tight">
          Cartograph Report for{" "}
          <span className="font-mono text-muted hover:text-ink transition-colors">
            {scanMeta?.repo?.owner}/{scanMeta?.repo?.name}
          </span>
        </h1>
        <div className="flex items-center gap-4">
          {!slug && (
            <>
              <button
                onClick={handleExportCsv}
                className="text-sm font-sans text-mute hover:text-ink transition-colors px-3 py-1.5 border border-surface rounded-md hover:bg-surface"
              >
                Export CSV
              </button>
              <button
                onClick={handleShareLink}
                className="text-sm font-sans text-mute hover:text-ink transition-colors px-3 py-1.5 bg-ink text-canvas rounded-md hover:bg-ink/90"
              >
                Share Link
              </button>
            </>
          )}
          <button
            onClick={() => {
              //TODO: Report feture
            }}
            className="text-sm font-sans text-mute hover:text-ink transition-colors px-3 py-1.5 border border-surface rounded-md hover:bg-surface"
          >
            Print PDF
          </button>
          <Link
            to="/"
            className="text-sm font-sans text-mute hover:text-ink transition-colors ml-4"
          >
            Start new scan
          </Link>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-y-auto">
        <div className="w-1/2 h-full flex flex-col">
          <RiskTreemap />
        </div>
        <div className="w-1/2 h-full flex flex-col min-h-0">
          <RankedList />
        </div>
      </div>

      <FileDetailPanel />
    </div>
  );
};
