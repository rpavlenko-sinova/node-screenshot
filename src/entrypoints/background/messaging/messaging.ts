import { type BridgeMessage } from '@/lib/enums/bridge';
import { defineExtensionMessaging } from '@webext-core/messaging';

type TPopupMessageData = {
  message: string;
  timestamp: number;
};

type TPopupMessageResponse = {
  success: boolean;
  message: string;
  timestamp: number;
};

type TPopupActionData = {
  action: string;
  timestamp: number;
};

type TPopupActionResponse = {
  success: boolean;
  action?: string;
  timestamp?: number;
  error?: string;
};

type TStorageGetData = {
  key: string;
};

type TStorageGetResponse = {
  success: boolean;
  key?: string;
  value?: unknown;
  timestamp?: number;
  error?: string;
};

type TStorageSetData = {
  key: string;
  value: string;
};

type TStorageSetResponse = {
  success: boolean;
  key?: string;
  value?: string;
  timestamp?: number;
  error?: string;
};

type TStorageDeleteData = {
  key: string;
};

type TStorageDeleteResponse = {
  success: boolean;
  key?: string;
  message?: string;
  timestamp?: number;
  error?: string;
};

type TCreateScreenshotData = {
  rect: DOMRect;
};

type TCreateScreenshotResponse = {
  success: boolean;
  timestamp?: number;
  error?: string;
};

type TModifyScreenshotData = {
  target: string;
  action: string;
  data?: any;
};

type TModifyScreenshotResponse = {
  success: boolean;
  timestamp?: number;
  data?: any;
  error?: string;
};

type TStartVideoRecordingData = {
  tabId: number;
};

type TStartVideoRecordingResponse = {
  success: boolean;
  timestamp?: number;
  error?: string;
};

type TStopVideoRecordingData = {
  tabId: number;
};

type TStopVideoRecordingResponse = {
  success: boolean;
  timestamp?: number;
  error?: string;
};

type TGetVideoRecordingsData = {};

type TGetVideoRecordingsResponse = {
  success: boolean;
  videos?: any[];
  timestamp?: number;
  error?: string;
};

type TDeleteVideoRecordingData = {
  id: string;
};

type TDeleteVideoRecordingResponse = {
  success: boolean;
  timestamp?: number;
  error?: string;
};

type TPlayVideoRecordingData = {
  id: string;
};

type TPlayVideoRecordingResponse = {
  success: boolean;
  timestamp?: number;
  error?: string;
};

type TSaveVideoRecordingData = {
  blobData: ArrayBuffer;
  blobType: string;
  blobSize: number;
};

type TSaveVideoRecordingResponse = {
  success: boolean;
  videoId?: string;
  timestamp?: number;
  error?: string;
};

type TPopupProtocol = {
  [BridgeMessage.PopupMessage]: (data: TPopupMessageData) => TPopupMessageResponse;
  [BridgeMessage.PopupAction]: (data: TPopupActionData) => TPopupActionResponse;
  [BridgeMessage.StorageGet]: (data: TStorageGetData) => TStorageGetResponse;
  [BridgeMessage.StorageSet]: (data: TStorageSetData) => TStorageSetResponse;
  [BridgeMessage.StorageDelete]: (data: TStorageDeleteData) => TStorageDeleteResponse;
  [BridgeMessage.CreateScreenshot]: (data: TCreateScreenshotData) => TCreateScreenshotResponse;
  [BridgeMessage.ModifyScreenshot]: (data: TModifyScreenshotData) => TModifyScreenshotResponse;
  [BridgeMessage.StartVideoRecording]: (data: TStartVideoRecordingData) => TStartVideoRecordingResponse;
  [BridgeMessage.StopVideoRecording]: (data: TStopVideoRecordingData) => TStopVideoRecordingResponse;
  [BridgeMessage.GetVideoRecordings]: (data: TGetVideoRecordingsData) => TGetVideoRecordingsResponse;
  [BridgeMessage.DeleteVideoRecording]: (data: TDeleteVideoRecordingData) => TDeleteVideoRecordingResponse;
  [BridgeMessage.PlayVideoRecording]: (data: TPlayVideoRecordingData) => TPlayVideoRecordingResponse;
  [BridgeMessage.SaveVideoRecording]: (data: TSaveVideoRecordingData) => TSaveVideoRecordingResponse;
};

export const { sendMessage, onMessage } = defineExtensionMessaging<TPopupProtocol>();
