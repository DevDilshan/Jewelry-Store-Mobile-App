import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  staffListCustomDesignRequests,
  staffPatchCustomDesignRequest,
  type CustomDesignRequestRow,
} from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import { mediaUrl } from "../../config";
import type { StaffStackParamList } from "../../navigation/types";
import { staffCanEditCustomDesignRequests } from "../../utils/staffRoles";
import { colors, radius, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffCustomDesignRequests">;

const STATUSES = ["pending", "in_review", "quoted", "declined", "completed"] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_review: "In review",
  quoted: "Quoted",
  declined: "Declined",
  completed: "Completed",
};

function requesterLabel(row: CustomDesignRequestRow): string {
  const c = row.customer;
  if (c && (c.firstName || c.lastName)) {
    return [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  }
  if (row.guestName?.trim()) return row.guestName.trim();
  return "—";
}

function requesterEmail(row: CustomDesignRequestRow): string {
  if (row.customer?.email) return row.customer.email;
  if (row.guestEmail) return row.guestEmail;
  return "";
}

// UI color mapping for request status badges
function pillStyle(status: string | undefined): { backgroundColor: string; color: string } {
  switch (status) {
    case "in_review":
      return { backgroundColor: "#dbeafe", color: "#1e40af" };
    case "quoted":
      return { backgroundColor: "#d1fae5", color: "#065f46" };
    case "declined":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    case "completed":
      return { backgroundColor: "#e7e5e4", color: colors.text };
    default:
      return { backgroundColor: "#fef3c7", color: "#92400e" };
  }
}

export function StaffCustomDesignRequestsScreen({ navigation }: Props) {
  const { token, staff } = useStaffAuth();
  const role = staff?.role ?? "viewer";
  const canEdit = staffCanEditCustomDesignRequests(role);

  const [rows, setRows] = useState<CustomDesignRequestRow[]>([]);
  const [metaTotal, setMetaTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CustomDesignRequestRow | null>(null);
  const [editStatus, setEditStatus] = useState("pending");
  const [editNote, setEditNote] = useState("");
  const [saveBusy, setSaveBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data, meta } = await staffListCustomDesignRequests(token, statusFilter || undefined);
      setRows(data);
      setMetaTotal(meta?.total ?? data.length);
    } catch (e) {
      Alert.alert("Custom designs", e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return navigation.addListener("focus", load);
  }, [navigation, load]);

  const openDetail = (row: CustomDesignRequestRow) => {
    setDetail(row);
    setEditStatus(row.status || "pending");
    setEditNote(row.staffNote || "");
  };

  const saveDetail = async () => {
    if (!token || !detail || !canEdit) return;
    setSaveBusy(true);
    try {
      const updated = await staffPatchCustomDesignRequest(token, detail._id, {
        status: editStatus,
        staffNote: editNote,
      });
      setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setDetail(updated);
      Alert.alert("Saved", "Request updated.");
    } catch (e) {
      Alert.alert("Save failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <View style={styles.flex}>
      <Text style={styles.lead}>
        Storefront inquiries (guest or signed-in) and sketch uploads. Tap a row for details.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Pressable
          style={[styles.filterChip, statusFilter === "" && styles.filterChipOn]}
          onPress={() => setStatusFilter("")}
        >
          <Text style={[styles.filterChipText, statusFilter === "" && styles.filterChipTextOn]}>All</Text>
        </Pressable>
        {STATUSES.map((s) => (
          <Pressable
            key={s}
            style={[styles.filterChip, statusFilter === s && styles.filterChipOn]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextOn]}>
              {STATUS_LABELS[s]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!canEdit ? (
        <Text style={styles.readonly}>View only — your role cannot change status or notes.</Text>
      ) : null}

      {loading && rows.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !loading ? <Text style={styles.empty}>No requests yet.</Text> : null
          }
          ListFooterComponent={
            metaTotal > 0 ? (
              <Text style={styles.meta}>
                Showing {rows.length} of {metaTotal}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => openDetail(item)} hitSlop={touch.hitSlop}>
              <Text style={styles.cardDate}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
              </Text>
              <Text style={styles.cardName}>{requesterLabel(item)}</Text>
              {requesterEmail(item) ? <Text style={styles.cardEmail}>{requesterEmail(item)}</Text> : null}
              <Text style={styles.cardTitle}>{item.title?.trim() || "—"}</Text>
              <View style={styles.cardRow}>
                <Text style={[styles.pill, pillStyle(item.status)]}>
                  {STATUS_LABELS[item.status || "pending"] || item.status}
                </Text>
                <Text style={styles.viewChev}>View ›</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal visible={detail != null} animationType="slide" transparent onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setDetail(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{detail?.title?.trim() || "Custom design"}</Text>
              <Pressable onPress={() => setDetail(null)} hitSlop={touch.hitSlop}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {detail?.sketchRelPath && mediaUrl(detail.sketchRelPath) ? (
                <Image
                  source={{ uri: mediaUrl(detail.sketchRelPath)! }}
                  style={styles.sketch}
                  contentFit="contain"
                />
              ) : (
                <View style={styles.sketchPh}>
                  <Text style={styles.sketchPhText}>No sketch image</Text>
                </View>
              )}
              <Text style={styles.modalMeta}>
                <Text style={styles.bold}>Requester: </Text>
                {detail ? requesterLabel(detail) : ""}
                {detail && requesterEmail(detail) ? ` (${requesterEmail(detail)})` : ""}
              </Text>
              {!detail?.customer && detail?.guestPhone ? (
                <Text style={styles.modalMeta}>
                  <Text style={styles.bold}>Phone (guest): </Text>
                  {detail.guestPhone}
                </Text>
              ) : null}
              {detail?.customer?.phone ? (
                <Text style={styles.modalMeta}>
                  <Text style={styles.bold}>Phone: </Text>
                  {detail.customer.phone}
                </Text>
              ) : null}
              {detail?.budgetNote ? (
                <Text style={styles.modalMeta}>
                  <Text style={styles.bold}>Budget: </Text>
                  {detail.budgetNote}
                </Text>
              ) : null}
              <Text style={styles.modalMeta}>
                <Text style={styles.bold}>Submitted: </Text>
                {detail?.createdAt ? new Date(detail.createdAt).toLocaleString() : "—"}
              </Text>
              <Text style={styles.sectionHead}>Description</Text>
              <Text style={styles.desc}>{detail?.description}</Text>

              <Text style={styles.sectionHead}>Status</Text>
              <View style={styles.statusRow}>
                {STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    style={[styles.statusChip, editStatus === s && styles.statusChipOn, !canEdit && { opacity: 0.7 }]}
                    disabled={!canEdit}
                    onPress={() => setEditStatus(s)}
                  >
                    <Text style={[styles.statusChipText, editStatus === s && styles.statusChipTextOn]}>
                      {STATUS_LABELS[s]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionHead}>Staff note (internal)</Text>
              <TextInput
                style={styles.noteInput}
                value={editNote}
                onChangeText={setEditNote}
                multiline
                editable={canEdit}
                placeholder="Internal notes (not shown to customer)"
                placeholderTextColor={colors.muted}
                maxLength={4000}
              />

              {canEdit ? (
                <Pressable
                  style={[styles.saveBtn, saveBusy && { opacity: 0.7 }]}
                  onPress={saveDetail}
                  disabled={saveBusy}
                >
                  <Text style={styles.saveBtnText}>{saveBusy ? "Saving…" : "Save changes"}</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  lead: {
    marginHorizontal: spacing.page,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  filters: { gap: 8, paddingHorizontal: spacing.page, paddingBottom: spacing.sm },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  filterChipOn: { borderColor: colors.accent, backgroundColor: "#fff7ed" },
  filterChipText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  filterChipTextOn: { color: colors.accent },
  readonly: {
    marginHorizontal: spacing.page,
    marginBottom: spacing.sm,
    fontSize: 13,
    color: colors.accentMuted,
    fontWeight: "600",
  },
  list: { padding: spacing.page, paddingBottom: spacing.xl },
  empty: { textAlign: "center", color: colors.muted, marginTop: 24 },
  meta: { textAlign: "center", color: colors.muted, marginTop: 12, fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.page,
    marginBottom: spacing.sm,
  },
  cardDate: { fontSize: 12, color: colors.muted },
  cardName: { marginTop: 6, fontSize: 16, fontWeight: "700", color: colors.text },
  cardEmail: { fontSize: 13, color: colors.muted, marginTop: 2 },
  cardTitle: { marginTop: 8, fontSize: 15, color: colors.text },
  cardRow: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pill: { fontSize: 12, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: "hidden" },
  viewChev: { fontSize: 15, fontWeight: "600", color: colors.accent },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "92%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: spacing.xl,
  },
  modalHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.page,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.text, flex: 1, paddingRight: 12 },
  modalClose: { fontSize: 22, color: colors.muted, padding: 4 },
  modalScroll: { paddingHorizontal: spacing.page, maxHeight: 520 },
  sketch: { width: "100%", height: 200, marginTop: spacing.md, borderRadius: 12, backgroundColor: colors.bg },
  sketchPh: {
    marginTop: spacing.md,
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  sketchPhText: { color: colors.muted, fontSize: 14 },
  modalMeta: { marginTop: 10, fontSize: 14, color: colors.text, lineHeight: 20 },
  bold: { fontWeight: "700" },
  sectionHead: { marginTop: 16, fontSize: 13, fontWeight: "700", color: colors.accentMuted, textTransform: "uppercase" },
  desc: { marginTop: 6, fontSize: 15, color: colors.text, lineHeight: 22 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  statusChipOn: { borderColor: colors.accent, backgroundColor: "#fff7ed" },
  statusChipText: { fontSize: 12, fontWeight: "600", color: colors.muted },
  statusChipTextOn: { color: colors.accent },
  noteInput: {
    marginTop: 8,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
