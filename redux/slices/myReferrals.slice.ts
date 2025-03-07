import { createSlice, Dispatch } from "@reduxjs/toolkit";
import { DEURO_API_CLIENT } from "../../app.config";
import { getFrontendCodeFromReferralName, getReferralLink, getReferralNameFromFrontendCode } from "@utils";
import { ReferralsState, DispatchString, DispatchBoolean, DispatchReferralsState, DispatchFrontendCode } from "./myReferrals.types";

const initialState: ReferralsState = {
  error: null,
  loaded: false,
  myReferralName: "",
  myReferralCount: 0,
  myTotalRewards: "0",
  myReferralLink: "",
  myFrontendCode: null
};

export const slice = createSlice({
  name: "myReferrals",
  initialState,
  reducers: {
    hasError(state, action: DispatchString) {
      state.error = action.payload;
    },
    setLoaded: (state, action: DispatchBoolean) => {
      state.loaded = action.payload;
    },
    setReferralData: (state, action: DispatchReferralsState) => {
      return { ...state, ...action.payload };
    },
    setMyReferralName: (state, action: DispatchString) => {
      state.myReferralName = action.payload;
    },
    setMyReferralLink: (state, action: DispatchString) => {
      state.myReferralLink = action.payload;
    },
    setMyFrontendCode: (state, action: DispatchFrontendCode) => {
      state.myFrontendCode = action.payload;
    }
  }
});

export const reducer = slice.reducer;
export const actions = slice.actions;

export const setMyReferralName = (name: string) => async (dispatch: Dispatch) => {
    dispatch(slice.actions.setMyReferralName(name));
    dispatch(slice.actions.setMyReferralLink(getReferralLink(name)));
    dispatch(slice.actions.setMyFrontendCode(getFrontendCodeFromReferralName(name)));
}

export const setMyFrontendCode = (code: `0x${string}`) => async (dispatch: Dispatch) => {
  dispatch(slice.actions.setMyFrontendCode(code));
  const name = getReferralNameFromFrontendCode(code);
  dispatch(slice.actions.setMyReferralName(name));
  dispatch(slice.actions.setMyReferralLink(getReferralLink(name)));
}

export const clearMyReferralData = () => async (dispatch: Dispatch) => {
  dispatch(slice.actions.setMyReferralName(""));
  dispatch(slice.actions.setMyReferralLink(""));
  dispatch(slice.actions.setMyFrontendCode(null));
}

export const fetchReferralData = () => async (dispatch: Dispatch) => {
  console.log("Loading [REDUX]: ReferralData");
  
  try {
    const response = await DEURO_API_CLIENT.get("/referrals/my-data");
    dispatch(slice.actions.setReferralData(response.data));
    dispatch(slice.actions.setLoaded(true));
  } catch (error) {
    dispatch(slice.actions.hasError((error as Error).message));
  }
};
