// components/sheets/sheetConstants.ts
import { Dimensions } from "react-native";

export const SHEET_HEIGHT_PERCENT = 0.7;
export const SHEET_HEIGHT_PX = Math.round(
  Dimensions.get("window").height * SHEET_HEIGHT_PERCENT
);
export const SHEET_HEIGHT_STYLE = "70%";