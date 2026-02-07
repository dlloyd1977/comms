"use client";

import { useEffect, useMemo, useState } from "react";
import { createSPAClient } from "@/lib/supabase/client";
import { FileObject } from "@supabase/storage-js";

const BUCKET = "kybalion-docs";
const MEMBERS_TABLE = "active_members";

type MemberStatus = {
  email: string;
  status: string | null;
  group: string | null;
};

type MemberRow = {
  status: string | null;
  group: string | null;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

type DocsFilesPanelProps = {
  prefix: string;
};

export default function DocsFilesPanel({ prefix }: DocsFilesPanelProps) {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);

  const client = useMemo(() => createSPAClient(), []);

  useEffect(() => {
    let isMounted = true;

    const loadFiles = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await client.storage
          .from(BUCKET)
          .list(prefix, { limit: 200, sortBy: { column: "name", order: "asc" } });

        if (error) throw error;
        if (isMounted) {
          setFiles(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError("Unable to load documents.");
        }
        console.error("Docs list error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const loadMemberStatus = async () => {
      try {
        const { data: authData } = await client.auth.getUser();
        const userEmail = authData.user?.email?.toLowerCase() || "";
        if (!userEmail) {
          if (isMounted) setMemberStatus(null);
          return;
        }
        const { data, error } = await client
          .from(MEMBERS_TABLE)
          .select("status, group")
          .eq("email", userEmail)
          .maybeSingle();
        if (error) throw error;
        const memberRow = data as MemberRow | null;
        if (isMounted) {
          setMemberStatus({
            email: userEmail,
            status: memberRow?.status || null,
            group: memberRow?.group || null,
          });
        }
      } catch (err) {
        console.error("Member status error:", err);
      }
    };

    loadFiles();
    loadMemberStatus();

    return () => {
      isMounted = false;
    };
  }, [client, prefix]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Storage</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Documents</h2>
          <p className="mt-1 text-sm text-slate-600">
            Files are loaded from Supabase bucket {BUCKET}.
          </p>
        </div>
        <div className="text-sm text-slate-600">
          {memberStatus?.email ? (
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
              Signed in as {memberStatus.email}
            </div>
          ) : (
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
              Public view
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-600">Loading documents...</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-600">{error}</p>
      ) : files.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">No files found in this folder.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Last updated</th>
                <th className="py-2 pr-4">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map((file) => (
                <tr key={file.name}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{file.name}</td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatDate(file.updated_at)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatFileSize(file.metadata?.size)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
