import { Type } from "@google/genai";
import { startNewGuidanceSession } from "./guiding/guiding_agent";

export const guideUserFunctionDeclaration = {
  name: "guide_user",
  description:
    "Guide the user to achieve his query. The function will open the web page and highlight the element that the user has to interact with. This should be used when the user asks for help to accomplish a task.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The query on which the user wants to be guided.",
      },
    },
    required: ["query"],
  },
};

export const guideUser = (query) => {
  startNewGuidanceSession(query);
};
