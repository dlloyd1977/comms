"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createSPAClient } from "@/lib/supabase/client";

const MEMBERS_TABLE = "active_members";
const DOCS_LAYOUT_TABLE = "kybalion_layout";
const DOCS_LAYOUT_ROW_ID = 2;
const DOCS_LAYOUT_KEY = "kybalion.docs.layout.order";
const DOCS_LAYOUT_POS_KEY = "kybalion.docs.layout.positions";

const SHARED_LAYOUT_KEYS = new Set([
  "back",
  "legacy",
  "auth",
  "user",
  "signout",
  "profile",
]);

const getAdminEmails = () =>
  (process.env.NEXT_PUBLIC_DOCS_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const formatTimestamp = (date: Date) =>
  date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

type MemberRow = {
  status: string | null;
  group: string | null;
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  middle_initial?: string | null;
  phone?: string | null;
  address?: string | null;
};

type LayoutPositions = Record<
  string,
  { left: number; top: number; width: number; height: number }
>;

type DragState = {
  type: "move" | "resize";
  startX: number;
  startY: number;
  startLeft: number;
  startTop: number;
  startWidth: number;
  startHeight: number;
  maxLeft: number;
  maxTop: number;
  maxWidth: number;
  maxHeight: number;
};

export default function DocsHeaderActions() {
  const client = useMemo(() => createSPAClient(), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layoutPositionsRef = useRef<LayoutPositions>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const dragItemRef = useRef<HTMLElement | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [layoutStatus, setLayoutStatus] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<MemberRow>({
    status: null,
    group: null,
    first_name: "",
    last_name: "",
    nickname: "",
    middle_initial: "",
    phone: "",
    address: "",
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const adminEmails = useMemo(() => getAdminEmails(), []);

  const getLayoutItems = useCallback(() => {
    const container = containerRef.current;
    if (!container) return [] as HTMLElement[];
    return Array.from(container.querySelectorAll("[data-layout-key]")) as HTMLElement[];
  }, []);

  const updateContainerHeight = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    let maxBottom = 0;
    getLayoutItems().forEach((item) => {
      if (item.classList.contains("is-hidden")) return;
      const top = parseFloat(item.style.top || "0");
      const height = parseFloat(item.style.height || `${item.getBoundingClientRect().height}`);
      maxBottom = Math.max(maxBottom, top + height);
    });
    if (maxBottom > 0) {
      container.style.minHeight = `${Math.ceil(maxBottom + 12)}px`;
    }
  }, [getLayoutItems]);

  const loadLayoutOrder = () => {
    try {
      const raw = localStorage.getItem(DOCS_LAYOUT_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [] as string[];
    }
  };

  const loadLayoutPositions = () => {
    try {
      const raw = localStorage.getItem(DOCS_LAYOUT_POS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? (parsed as LayoutPositions) : {};
    } catch {
      return {} as LayoutPositions;
    }
  };

  const getLayoutOrderFromDom = useCallback(
    () =>
      getLayoutItems()
        .map((item) => item.dataset.layoutKey)
        .filter(Boolean) as string[],
    [getLayoutItems]
  );

  const applyLayoutOrder = useCallback((order: string[]) => {
    if (!Array.isArray(order) || !order.length) return;
    const items = getLayoutItems();
    const orderMap = new Map(order.map((key, index) => [key, index]));
    items.forEach((item, index) => {
      const key = item.dataset.layoutKey || "";
      const nextOrder = orderMap.has(key) ? orderMap.get(key) : order.length + index;
      item.style.order = `${nextOrder}`;
    });
  }, [getLayoutItems]);

  const applyLayoutPositions = useCallback((positions: LayoutPositions) => {
    const container = containerRef.current;
    if (!container) return;
    const containerWidth = container.getBoundingClientRect().width;
    const padding = 10;

    let maxRight = 0;
    let fallbackTop = 10;

    getLayoutItems().forEach((item) => {
      const key = item.dataset.layoutKey;
      if (!key) return;
      const pos = positions[key];
      if (pos && pos.width > 0) {
        const width = Math.max(80, Math.round(pos.width));
        const height = Math.max(36, Math.round(pos.height));
        const maxLeft = Math.max(0, containerWidth - width - padding);
        const clampedLeft = Math.min(Math.max(0, Math.round(pos.left)), maxLeft);
        const clampedTop = Math.max(0, Math.round(pos.top));
        item.style.left = `${clampedLeft}px`;
        item.style.top = `${clampedTop}px`;
        item.style.width = `${width}px`;
        item.style.height = `${height}px`;
        maxRight = Math.max(maxRight, clampedLeft + width);
        fallbackTop = Math.max(0, Math.min(fallbackTop, clampedTop));
      }
    });

    const gap = 12;
    let nextLeft = maxRight > 0 ? maxRight + gap : padding;
    getLayoutItems().forEach((item) => {
      const key = item.dataset.layoutKey;
      if (!key) return;
      if (positions[key] && positions[key].width > 0) return;
      const rect = item.getBoundingClientRect();
      const width = Math.max(80, Math.round(rect.width) || 100);
      const height = Math.max(36, Math.round(rect.height) || 40);
      if (containerWidth > 0 && nextLeft + width > containerWidth - padding && nextLeft > padding) {
        nextLeft = padding;
        fallbackTop += height + gap;
      }
      const maxLeft = Math.max(0, containerWidth - width - padding);
      const clampedLeft = Math.min(Math.max(0, nextLeft), maxLeft);
      item.style.left = `${clampedLeft}px`;
      item.style.top = `${Math.max(0, fallbackTop)}px`;
      item.style.width = `${width}px`;
      item.style.height = `${height}px`;
      nextLeft += width + gap;
    });

    updateContainerHeight();
  }, [getLayoutItems, updateContainerHeight]);

  const clearLayoutPositions = useCallback(() => {
    layoutPositionsRef.current = {};
    localStorage.removeItem(DOCS_LAYOUT_POS_KEY);
    document.body?.classList.remove("docs-layout-freeform");
    const container = containerRef.current;
    if (container) container.style.minHeight = "";
    getLayoutItems().forEach((item) => {
      item.style.removeProperty("left");
      item.style.removeProperty("top");
      item.style.removeProperty("width");
      item.style.removeProperty("height");
    });
  }, [getLayoutItems]);

  const saveLayoutToStorage = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const positions: LayoutPositions = { ...layoutPositionsRef.current };
    getLayoutItems().forEach((item) => {
      const key = item.dataset.layoutKey;
      if (!key) return;
      if (item.classList.contains("is-hidden")) return;
      const rect = item.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      positions[key] = {
        left: Math.max(0, Math.round(rect.left - containerRect.left)),
        top: Math.max(0, Math.round(rect.top - containerRect.top)),
        width: Math.max(80, Math.round(rect.width)),
        height: Math.max(36, Math.round(rect.height)),
      };
    });
    layoutPositionsRef.current = positions;
    localStorage.setItem(DOCS_LAYOUT_POS_KEY, JSON.stringify(positions));
    updateContainerHeight();
  }, [getLayoutItems, updateContainerHeight]);

  const filterSharedPositions = (positions: LayoutPositions) => {
    const out: LayoutPositions = {};
    Object.keys(positions || {}).forEach((key) => {
      if (SHARED_LAYOUT_KEYS.has(key)) {
        out[key] = positions[key];
      }
    });
    return out;
  };

  const filterSharedOrder = (order: string[]) =>
    order.filter((key) => SHARED_LAYOUT_KEYS.has(key));

  const saveLayoutToDatabase = useCallback(async () => {
    if (!isAdmin) return;
    const email = userEmail || "";
    if (!email) return;
    const order = filterSharedOrder(loadLayoutOrder());
    const positions = filterSharedPositions(layoutPositionsRef.current);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from(DOCS_LAYOUT_TABLE)
      .upsert(
        {
          id: DOCS_LAYOUT_ROW_ID,
          positions,
          order,
          updated_at: new Date().toISOString(),
          updated_by: email,
        },
        { onConflict: "id" }
      );
    if (error) {
      setLayoutStatus(`Layout save failed: ${error.message}`);
    } else {
      setLayoutStatus("Layout saved for all visitors.");
    }
  }, [client, isAdmin, userEmail]);

  const loadLayoutFromDatabase = useCallback(async () => {
    const { data, error } = await client
      .from(DOCS_LAYOUT_TABLE)
      .select("positions, order")
      .eq("id", DOCS_LAYOUT_ROW_ID)
      .maybeSingle();
    if (error || !data) return null;
    return data as { positions: LayoutPositions; order: string[] };
  }, [client]);

  const applySharedLayout = useCallback(async () => {
    const sharedLayout = await loadLayoutFromDatabase();
    if (!sharedLayout) return;
    const sharedOrder = filterSharedOrder(sharedLayout.order || []);
    const sharedPositions = filterSharedPositions(sharedLayout.positions || {});
    if (sharedOrder.length) {
      applyLayoutOrder(sharedOrder);
      localStorage.setItem(DOCS_LAYOUT_KEY, JSON.stringify(sharedOrder));
    }
    if (Object.keys(sharedPositions).length) {
      layoutPositionsRef.current = isAdmin
        ? { ...layoutPositionsRef.current, ...sharedPositions }
        : { ...sharedPositions };
      applyLayoutPositions(layoutPositionsRef.current);
      localStorage.setItem(DOCS_LAYOUT_POS_KEY, JSON.stringify(layoutPositionsRef.current));
    }
  }, [applyLayoutOrder, applyLayoutPositions, isAdmin, loadLayoutFromDatabase]);

  const calculateInitialPositions = useCallback(() => {
    const container = containerRef.current;
    if (!container) return {} as LayoutPositions;
    const prevWidth = container.style.width;
    container.style.width = "100%";
    const containerWidth = container.getBoundingClientRect().width;
    container.style.width = prevWidth;

    const padding = 10;
    const gap = 16;
    const positions: LayoutPositions = {};
    let currentLeft = padding;
    let currentTop = padding;
    let rowHeight = 0;

    getLayoutItems().forEach((item) => {
      const key = item.dataset.layoutKey;
      if (!key) return;
      const rect = item.getBoundingClientRect();
      const width = Math.max(80, Math.round(rect.width) + 22);
      const height = Math.max(36, Math.round(rect.height) + 14);
      if (currentLeft + width > containerWidth - padding && currentLeft > padding) {
        currentLeft = padding;
        currentTop += rowHeight + gap;
        rowHeight = 0;
      }
      positions[key] = {
        left: Math.round(currentLeft),
        top: Math.round(currentTop),
        width,
        height,
      };
      currentLeft += width + gap;
      rowHeight = Math.max(rowHeight, height);
    });

    return positions;
  }, [getLayoutItems]);

  const setLayoutEditingState = useCallback((enabled: boolean) => {
    setLayoutEditing(enabled);
    document.body?.classList.toggle("docs-layout-editing", enabled);
    if (enabled) {
      if (!Object.keys(layoutPositionsRef.current).length) {
        layoutPositionsRef.current = calculateInitialPositions();
        applyLayoutPositions(layoutPositionsRef.current);
        saveLayoutToStorage();
      }
      document.body?.classList.add("docs-layout-freeform");
      if (!resizeObserverRef.current && "ResizeObserver" in window) {
        resizeObserverRef.current = new ResizeObserver(() => {
          saveLayoutToStorage();
          if (isAdmin) void saveLayoutToDatabase();
        });
        getLayoutItems().forEach((item) => resizeObserverRef.current?.observe(item));
      }
    } else if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
      saveLayoutToStorage();
      if (isAdmin) void saveLayoutToDatabase();
    }
  }, [applyLayoutPositions, calculateInitialPositions, getLayoutItems, isAdmin, saveLayoutToDatabase, saveLayoutToStorage]);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    if (!layoutEditing) return;
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const isResizeCorner =
      event.clientX > rect.right - 16 && event.clientY > rect.bottom - 16;
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    dragItemRef.current = target;
    dragStateRef.current = {
      type: isResizeCorner ? "resize" : "move",
      startX: event.clientX,
      startY: event.clientY,
      startLeft: parseFloat(target.style.left || "0"),
      startTop: parseFloat(target.style.top || "0"),
      startWidth: parseFloat(target.style.width || `${rect.width}`),
      startHeight: parseFloat(target.style.height || `${rect.height}`),
      maxLeft: Math.max(0, containerRect.width - rect.width),
      maxTop: Math.max(0, containerRect.height - rect.height),
      maxWidth: Math.max(120, containerRect.width),
      maxHeight: Math.max(36, containerRect.height),
    };

    target.classList.add("docs-layout-dragging");
    target.setPointerCapture(event.pointerId);
  }, [layoutEditing]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!layoutEditing) return;
    const item = dragItemRef.current;
    const dragState = dragStateRef.current;
    if (!item || !dragState) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (dragState.type === "resize") {
      const nextWidth = Math.max(80, dragState.startWidth + deltaX);
      const nextHeight = Math.max(36, dragState.startHeight + deltaY);
      item.style.width = `${Math.min(nextWidth, dragState.maxWidth)}px`;
      item.style.height = `${Math.min(nextHeight, dragState.maxHeight)}px`;
    } else {
      const nextLeft = Math.min(Math.max(0, dragState.startLeft + deltaX), dragState.maxLeft);
      const nextTop = Math.max(0, dragState.startTop + deltaY);
      item.style.left = `${Math.round(nextLeft)}px`;
      item.style.top = `${Math.round(nextTop)}px`;
    }
    updateContainerHeight();
  }, [layoutEditing, updateContainerHeight]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (!layoutEditing) return;
    const item = dragItemRef.current;
    if (!item) return;
    item.classList.remove("docs-layout-dragging");
    item.releasePointerCapture?.(event.pointerId);
    dragItemRef.current = null;
    dragStateRef.current = null;
    saveLayoutToStorage();
    if (isAdmin) void saveLayoutToDatabase();
  }, [isAdmin, layoutEditing, saveLayoutToDatabase, saveLayoutToStorage]);

  const resetLayout = async () => {
    clearLayoutPositions();
    localStorage.removeItem(DOCS_LAYOUT_KEY);
    setLayoutEditingState(false);
    if (isAdmin) {
      await client.from(DOCS_LAYOUT_TABLE).delete().eq("id", DOCS_LAYOUT_ROW_ID);
      setLayoutStatus("Layout reset for all visitors.");
    }
  };

  const loadProfile = useCallback(async (email: string) => {
    const { data, error } = await client
      .from(MEMBERS_TABLE)
      .select("first_name,last_name,nickname,middle_initial,phone,address,group,status")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      setProfileMessage(`Failed to load profile: ${error.message}`);
      return;
    }
    const row = (data || {}) as MemberRow;
    setProfileData({
      status: row.status || null,
      group: row.group || null,
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      nickname: row.nickname || "",
      middle_initial: row.middle_initial || "",
      phone: row.phone || "",
      address: row.address || "",
    });
  }, [client]);

  const saveProfile = async () => {
    if (!userEmail) return;
    if (!profileData.first_name?.trim() || !profileData.last_name?.trim()) {
      setProfileMessage("First name and last name are required.");
      return;
    }
    setProfileMessage("Saving profile...");
    const updates = {
      first_name: profileData.first_name.trim(),
      last_name: profileData.last_name.trim(),
      nickname: profileData.nickname?.trim() || null,
      middle_initial: profileData.middle_initial?.trim() || null,
      phone: profileData.phone?.trim() || null,
      address: profileData.address?.trim() || null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from(MEMBERS_TABLE)
      .update(updates)
      .eq("email", userEmail);
    if (error) {
      setProfileMessage(`Save failed: ${error.message}`);
      return;
    }
    setProfileMessage("Profile saved.");
    setTimeout(() => setProfileOpen(false), 900);
  };

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const { data } = await client.auth.getUser();
      const email = data.user?.email?.toLowerCase() || null;
      if (!mounted) return;
      setUserEmail(email);
      if (!email) {
        setIsAdmin(false);
        clearLayoutPositions();
        return;
      }
      const { data: memberData } = await client
        .from(MEMBERS_TABLE)
        .select("status, group")
        .eq("email", email)
        .maybeSingle();
      const member = (memberData || {}) as MemberRow;
      const active = member.status === "active";
      const admin = member.group === "admin" || adminEmails.includes(email);
      setIsAdmin(admin);
      if (active) {
        await applySharedLayout();
      } else {
        clearLayoutPositions();
      }
    };

    loadUser();

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email?.toLowerCase() || null;
      setUserEmail(email);
      if (!email) {
        setIsAdmin(false);
        clearLayoutPositions();
        return;
      }
      client
        .from(MEMBERS_TABLE)
        .select("status, group")
        .eq("email", email)
        .maybeSingle()
        .then(({ data: memberData }) => {
          const member = (memberData || {}) as MemberRow;
          const active = member.status === "active";
          const admin = member.group === "admin" || adminEmails.includes(email);
          setIsAdmin(admin);
          if (active) {
            void applySharedLayout();
          } else {
            clearLayoutPositions();
          }
        });
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [adminEmails, applySharedLayout, clearLayoutPositions, client]);

  useEffect(() => {
    const order = loadLayoutOrder();
    if (order.length) {
      applyLayoutOrder(order);
    } else {
      const domOrder = getLayoutOrderFromDom();
      localStorage.setItem(DOCS_LAYOUT_KEY, JSON.stringify(domOrder));
    }
    layoutPositionsRef.current = loadLayoutPositions();
    if (Object.keys(layoutPositionsRef.current).length) {
      applyLayoutPositions(layoutPositionsRef.current);
      document.body?.classList.add("docs-layout-freeform");
    }
  }, [applyLayoutOrder, applyLayoutPositions, getLayoutOrderFromDom]);

  useEffect(() => {
    const items = getLayoutItems();
    const handlerDown = (event: PointerEvent) => handlePointerDown(event);
    const handlerMove = (event: PointerEvent) => handlePointerMove(event);
    const handlerUp = (event: PointerEvent) => handlePointerUp(event);

    items.forEach((item) => {
      item.addEventListener("pointerdown", handlerDown);
      item.addEventListener("pointermove", handlerMove);
      item.addEventListener("pointerup", handlerUp);
      item.addEventListener("pointercancel", handlerUp);
    });

    return () => {
      items.forEach((item) => {
        item.removeEventListener("pointerdown", handlerDown);
        item.removeEventListener("pointermove", handlerMove);
        item.removeEventListener("pointerup", handlerUp);
        item.removeEventListener("pointercancel", handlerUp);
      });
    };
  }, [getLayoutItems, handlePointerDown, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!isAdmin && layoutEditing) {
      setLayoutEditingState(false);
    }
  }, [isAdmin, layoutEditing, setLayoutEditingState]);

  useEffect(() => {
    if (profileOpen && userEmail) {
      setProfileMessage(null);
      void loadProfile(userEmail);
    }
  }, [loadProfile, profileOpen, userEmail]);

  return (
    <div
      ref={containerRef}
      className="docs-header-actions relative flex flex-wrap items-center justify-end gap-3"
    >
      <Link
        href="/kybalion"
        className="docs-layout-item rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        data-layout-key="back"
      >
        Kybalion hub
      </Link>
      <Link
        href="/old/kybalion/docs"
        className="docs-layout-item rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        data-layout-key="legacy"
      >
        Legacy docs
      </Link>

      {!userEmail ? (
        <Link
          href="/auth/login"
          className="docs-layout-item rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          data-layout-key="auth"
        >
          Sign In / Create Account
        </Link>
      ) : (
        <span
          className="docs-layout-item rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
          data-layout-key="user"
        >
          Signed in as {userEmail}
        </span>
      )}

      {userEmail ? (
        <button
          type="button"
          className="docs-layout-item rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          data-layout-key="profile"
          onClick={() => setProfileOpen(true)}
        >
          Profile
        </button>
      ) : null}

      {userEmail ? (
        <button
          type="button"
          className="docs-layout-item rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          data-layout-key="signout"
          onClick={() => client.auth.signOut()}
        >
          Log out
        </button>
      ) : null}

      {isAdmin ? (
        <button
          type="button"
          className={`docs-layout-item rounded-full border px-4 py-2 text-sm font-semibold ${
            layoutEditing
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          data-layout-key="editbtn"
          onClick={() => setLayoutEditingState(!layoutEditing)}
        >
          {layoutEditing ? "Exit layout edit" : "Edit layout"}
        </button>
      ) : null}

      {isAdmin ? (
        <button
          type="button"
          className="docs-layout-item rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          data-layout-key="resetbtn"
          onClick={() => void resetLayout()}
        >
          Reset layout
        </button>
      ) : null}

      {layoutStatus ? (
        <span className="text-xs text-slate-500">{layoutStatus}</span>
      ) : null}

      {profileOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>
              <button
                type="button"
                className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700"
                onClick={() => setProfileOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                First Name *
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={profileData.first_name || ""}
                  onChange={(event) =>
                    setProfileData((prev) => ({
                      ...prev,
                      first_name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Last Name *
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={profileData.last_name || ""}
                  onChange={(event) =>
                    setProfileData((prev) => ({
                      ...prev,
                      last_name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Email
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700"
                  value={userEmail || ""}
                  disabled
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Nickname
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={profileData.nickname || ""}
                  onChange={(event) =>
                    setProfileData((prev) => ({
                      ...prev,
                      nickname: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Middle Initial
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={profileData.middle_initial || ""}
                  maxLength={1}
                  onChange={(event) =>
                    setProfileData((prev) => ({
                      ...prev,
                      middle_initial: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Phone
                <input
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  value={profileData.phone || ""}
                  onChange={(event) =>
                    setProfileData((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Address
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                value={profileData.address || ""}
                onChange={(event) =>
                  setProfileData((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
              />
            </label>

            {profileMessage ? (
              <p className="mt-3 text-sm text-slate-600">{profileMessage}</p>
            ) : null}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={() => setProfileOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => void saveProfile()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {layoutStatus ? `${layoutStatus} ${formatTimestamp(new Date())}` : ""}
      </div>
    </div>
  );
}
