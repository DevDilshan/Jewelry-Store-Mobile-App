import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { staffDeleteDiscount, staffFetchDiscounts, type StaffDiscount } from "../../api/staffApi";
import { useStaffAuth } from "../../context/StaffAuthContext";
import type { StaffDiscountLike, StaffStackParamList } from "../../navigation/types";
import { colors, spacing, touch } from "../../theme";

return (
    <View style={styles.flex}>
      <Pressable
        style={styles.add}
        onPress={() => navigation.navigate("StaffDiscountEditor", {})}
        hitSlop={touch.hitSlop}
      >
        <Text style={styles.addText}>+ Add discount</Text>
      </Pressable>
      {loading && rows.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                onPress={() => navigation.navigate("StaffDiscountEditor", { discount: toLike(item) })}
                hitSlop={touch.hitSlop}
              >
                <Text style={styles.name}>{item.discountName}</Text>
                <Text style={styles.meta}>
                  {item.promoScope === "site_wide" ? "Site-wide" : `Code ${item.discountCoupon}`} {" "}
                 
                  {item.discountType === "percentage" ? ` \n  Percentage - ${item.discountAmount}%` : `LKR ${item.discountAmount}`}
                </Text>
              </Pressable>
              <Pressable style={styles.del} onPress={() => onDelete(item)} hitSlop={touch.hitSlop}>
                <Text style={styles.delText}>Delete</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}
