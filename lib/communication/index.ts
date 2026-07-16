export type {
  ChannelSendResult,
  CommunicationChannel,
  CommunicationChannelAdapter,
  CommunicationDirection,
  CommunicationRecord,
  CommunicationStatus,
  CustomerCommunicationBundle,
  FollowUpReminder,
  FollowUpStatus,
  LogCommunicationInput,
  SendMessageInput,
} from "@/lib/communication/types";

export { getCommunicationService, CommunicationService } from "@/lib/communication/service";
export {
  CallChannelAdapter,
  SmsChannelAdapter,
  EmailChannelAdapter,
  PushChannelAdapter,
  WhatsAppChannelAdapter,
  AiChannelAdapter,
  mapsUrlForAddress,
} from "@/lib/communication/channels";
