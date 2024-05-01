import { Tokens } from "../../types";
import { mBold } from "./bold";
import { mBoldAndItalic } from "./bold&italic";
import { mCode } from "./code";
import { mHeaderFactory } from "./headers";
import { mItalic } from "./italic";
import { mStrike } from "./strikethrough";

export const mLink = (text: string) => {
  const capture = text.match(/(^https?:\/\/|^www\.)\S+/i)?.[0];

  if (!capture) {
    return null;
  }

  return {
    type: "link" as Tokens,
    value: "",
    textOnly: true,
    capture,
    startOnly: false,
    forceEnd: true,
    hasEndNode: true,
  };
};

export const matchers = {
  "`": mCode,
  "~": mStrike,
  "*": mItalic,
  "**": mBold,
  "***": mBoldAndItalic,
  "#": mHeaderFactory(1),
  "##": mHeaderFactory(2),
  "###": mHeaderFactory(3),
  "####": mHeaderFactory(4),
  "#####": mHeaderFactory(5),
  "######": mHeaderFactory(6),
};
