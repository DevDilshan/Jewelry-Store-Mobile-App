import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  adminDeletePortfolioImage,
  adminUploadPortfolioImage,
  designerCreatePortfolio,
  designerDeletePortfolioImage,
  designerFetchMyPortfolio,
  designerPatchMyPortfolio,
  designerUploadPortfolioImage,
  type DesignerPortfolioFull,
  type PortfolioImage,
  staffFetchPortfolio,
  staffPatchPortfolio,
} from "../../api/staffApi";
import { mediaUrl } from "../../config";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffStackParamList } from "../../navigation/types";
import { staffCanEditPortfolios, staffIsDesigner } from "../../utils/staffRoles";
import { colors, spacing, touch } from "../../theme";

type Props = NativeStackScreenProps<StaffStackParamList, "StaffPortfolioEditor">;

const MAX_IMAGES = 15;

export function StaffPortfolioEditorScreen({ navigation, route }: Props) {
  const { token, staff } = useStaffAuth();
  const mine = route.params?.mine === true;
  const adminId = route.params?.id;

  const role = staff?.role ?? "";
  const canEditDesigner = mine && staffIsDesigner(role);
  const canEditAdmin = !mine && Boolean(adminId) && staffCanEditPortfolios(role);
  const canEdit = canEditDesigner || canEditAdmin;
  /** Designers use /me/images; admin & product manager use /admin/:id/images */
  const canManageImages =
    (mine && canEditDesigner) || (!mine && canEditAdmin && Boolean(adminId));

  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<DesignerPortfolioFull | null>(null);
  const [needsCreate, setNeedsCreate] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [yearsExperience, setYearsExperience] = useState("0");
  const [completedProjects, setCompletedProjects] = useState("0");
  const [published, setPublished] = useState(false);
  const [images, setImages] = useState<PortfolioImage[]>([]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const applyPortfolio = useCallback((row: DesignerPortfolioFull) => {
    setPortfolio(row);
    setDisplayName(row.displayName);
    setHeadline(row.headline ?? "");
    setBio(row.bio ?? "");
    setSpecialties((row.specialties || []).join(", "));
    setYearsExperience(
      row.yearsOfExperience !== undefined && row.yearsOfExperience !== null
        ? String(row.yearsOfExperience)
        : "0"
    );
    setCompletedProjects(
      row.completedProjects !== undefined && row.completedProjects !== null
        ? String(row.completedProjects)
        : "0"
    );
    setPublished(Boolean(row.isPublished));
    setImages([...(row.images || [])]);
    setNeedsCreate(false);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (mine) {
        if (!staffIsDesigner(role)) {
          Alert.alert("Portfolio", "This screen is for designer accounts.");
          navigation.goBack();
          return;
        }
        const row = await designerFetchMyPortfolio(token);
        if (!row) {
          setNeedsCreate(true);
          setPortfolio(null);
          setImages([]);
        } else {
          applyPortfolio(row);
        }
      } else if (adminId) {
        const row = await staffFetchPortfolio(token, adminId);
        applyPortfolio(row);
      }
    } catch (e) {
      Alert.alert("Portfolio", e instanceof Error ? e.message : "Could not load");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [token, mine, adminId, role, navigation, applyPortfolio]);

  useEffect(() => {
    load();
  }, [load]);

  useLayoutEffect(() => {
    const title = mine ? "My portfolio" : portfolio?.displayName ?? "Portfolio";
    navigation.setOptions({ title });
  }, [navigation, mine, portfolio?.displayName]);

  const saveProfile = async () => {
    if (!token || !canEdit) return;
    const name = displayName.trim();
    if (name.length < 2 || name.length > 120) {
      Alert.alert("Portfolio", "Display name must be 2–120 characters.");
      return;
    }
    const yearsOfExperienceNum = Number(yearsExperience);
    const completedProjectsNum = Number(completedProjects);
    const spec = specialties
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setSaving(true);
    try {
      if (mine) {
        if (needsCreate || !portfolio) {
          const row = await designerCreatePortfolio(token, {
            displayName: name,
            headline: headline.trim(),
            bio: bio.trim(),
            specialties: spec,
            yearsOfExperience: yearsOfExperienceNum,
            completedProjects: completedProjectsNum,
            isPublished: published,
          });
          applyPortfolio(row);
        } else {
          const row = await designerPatchMyPortfolio(token, {
            displayName: name,
            headline: headline.trim(),
            bio: bio.trim(),
            specialties: spec,
            yearsOfExperience: yearsOfExperienceNum,
            completedProjects: completedProjectsNum,
            isPublished: published,
          });
          applyPortfolio(row);
        }
      } else if (adminId) {
        const row = await staffPatchPortfolio(token, adminId, {
          displayName: name,
          headline: headline.trim(),
          bio: bio.trim(),
          specialties: spec,
          yearsOfExperience: yearsOfExperienceNum,
          completedProjects: completedProjectsNum,
          isPublished: published,
        });
        applyPortfolio(row);
      }
    } catch (e) {
      Alert.alert("Portfolio", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const persistImageOrder = async (next: PortfolioImage[]) => {
    if (!token || !portfolio) return;
    const ids = next.map((i) => i._id);
    setImages(next);
    try {
      if (mine) {
        const row = await designerPatchMyPortfolio(token, { imageOrder: ids });
        applyPortfolio(row);
      } else if (adminId) {
        const row = await staffPatchPortfolio(token, adminId, { imageOrder: ids });
        applyPortfolio(row);
      }
    } catch (e) {
      Alert.alert("Order", e instanceof Error ? e.message : "Could not reorder");
      await load();
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[index], next[j]] = [next[j], next[index]];
    void persistImageOrder(next);
  };

  const onPickImage = async () => {
    if (!token || !canManageImages || !portfolio) {
      Alert.alert("Images", "Save your profile first, then add photos (up to 15).");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Images", `At most ${MAX_IMAGES} images.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos", "Permission is required to choose images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const row = mine
        ? await designerUploadPortfolioImage(token, asset.uri, asset.mimeType ?? "image/jpeg", "")
        : await adminUploadPortfolioImage(
            token,
            portfolio._id,
            asset.uri,
            asset.mimeType ?? "image/jpeg",
            ""
          );
      applyPortfolio(row);
    } catch (e) {
      Alert.alert("Upload", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDeleteImage = (img: PortfolioImage) => {
    if (!token || !canManageImages) return;
    Alert.alert("Remove image", "Delete this photo from the portfolio?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const row = mine
              ? await designerDeletePortfolioImage(token, img._id)
              : await adminDeletePortfolioImage(token, portfolio!._id, img._id);
            applyPortfolio(row);
          } catch (e) {
            Alert.alert("Error", e instanceof Error ? e.message : "Could not delete");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const showImageSection = Boolean(portfolio) || !mine;
  const readOnly = !canEdit;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
      {readOnly ? (
        <Text style={styles.banner}>View only — you can browse this portfolio but not edit it.</Text>
      ) : null}

      <Text style={styles.label}>Display name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} editable={!readOnly} />

      <Text style={styles.label}>Headline</Text>
      <TextInput style={styles.input} value={headline} onChangeText={setHeadline} editable={!readOnly} />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.tall]}
        value={bio}
        onChangeText={setBio}
        multiline
        editable={!readOnly}
      />

      <Text style={styles.label}>Specialties (comma-separated)</Text>
      <TextInput style={styles.input} value={specialties} onChangeText={setSpecialties} editable={!readOnly} />

      <Text style={styles.label}>Years of experience (0–80)</Text>
      <TextInput
        style={styles.input}
        value={yearsExperience}
        onChangeText={setYearsExperience}
        editable={!readOnly}
        keyboardType="default"
      />

      <Text style={styles.label}>Completed projects (0–100,000)</Text>
      <TextInput
        style={styles.input}
        value={completedProjects}
        onChangeText={setCompletedProjects}
        editable={!readOnly}
        keyboardType="default"
      />

      <View style={styles.row}>
        <Text style={styles.label}>Published on storefront</Text>
        <Switch
          value={published}
          onValueChange={setPublished}
          disabled={readOnly}
          trackColor={{ true: colors.accent }}
        />
      </View>

      {canEdit ? (
        <Pressable style={[styles.cta, saving && { opacity: 0.75 }]} onPress={saveProfile} disabled={saving}>
          <Text style={styles.ctaText}>
            {saving ? "Saving…" : needsCreate ? "Create portfolio" : "Save profile"}
          </Text>
        </Pressable>
      ) : null}

      {mine && needsCreate ? (
        <Text style={styles.hint}>Create your portfolio first. You can add up to {MAX_IMAGES} photos afterward.</Text>
      ) : null}

      {showImageSection ? (
        <>
          <Text style={styles.section}>Gallery</Text>
          {images.length === 0 ? (
            <Text style={styles.muted}>No images yet.</Text>
          ) : (
            images.map((img, index) => {
              const uri = mediaUrl(img.relPath);
              return (
                <View key={img._id} style={styles.imgCard}>
                  <View style={styles.imgRow}>
                    {uri ? (
                      <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.ph]} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.caption} numberOfLines={2}>
                        {img.caption || "—"}
                      </Text>
                      {canEdit && images.length > 1 ? (
                        <View style={styles.orderBtns}>
                          <Pressable
                            style={[styles.orderBtn, index === 0 && styles.orderBtnOff]}
                            disabled={index === 0}
                            onPress={() => move(index, -1)}
                            hitSlop={touch.hitSlop}
                          >
                            <Text style={styles.orderBtnText}>Up</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.orderBtn, index === images.length - 1 && styles.orderBtnOff]}
                            disabled={index === images.length - 1}
                            onPress={() => move(index, 1)}
                            hitSlop={touch.hitSlop}
                          >
                            <Text style={styles.orderBtnText}>Down</Text>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  {canManageImages ? (
                    <Pressable style={styles.delImg} onPress={() => onDeleteImage(img)} hitSlop={touch.hitSlop}>
                      <Text style={styles.delImgText}>Remove photo</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          )}

          {canManageImages ? (
            <Pressable
              style={[styles.addImg, uploading && { opacity: 0.75 }]}
              onPress={onPickImage}
              disabled={uploading || !portfolio}
              hitSlop={touch.hitSlop}
            >
              <Text style={styles.addImgText}>{uploading ? "Uploading…" : "+ Add photo from library"}</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bg },
  scroll: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.page, paddingBottom: spacing.xl },
  banner: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    color: colors.muted,
    lineHeight: 20,
  },
  section: { marginTop: 28, marginBottom: 10, fontSize: 18, fontWeight: "700", color: colors.text },
  label: { fontSize: 14, fontWeight: "600", color: colors.muted, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.surface,
    fontSize: 16,
    minHeight: touch.minHeight,
  },
  tall: { minHeight: 120, textAlignVertical: "top" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  cta: {
    marginTop: 24,
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { marginTop: 12, fontSize: 14, color: colors.muted, lineHeight: 20 },
  muted: { fontSize: 15, color: colors.muted, marginBottom: 8 },
  imgCard: {
    marginBottom: 14,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imgRow: { flexDirection: "row", gap: 12 },
  thumb: { width: 96, height: 96, borderRadius: 10, backgroundColor: colors.border },
  ph: { backgroundColor: colors.border },
  caption: { fontSize: 14, color: colors.text },
  orderBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
  orderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  orderBtnOff: { opacity: 0.35 },
  orderBtnText: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  delImg: { marginTop: 10, alignSelf: "flex-start" },
  delImgText: { color: colors.danger, fontWeight: "600" },
  addImg: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    minHeight: touch.minHeight,
    justifyContent: "center",
  },
  addImgText: { color: colors.accent, fontWeight: "700" },
});
