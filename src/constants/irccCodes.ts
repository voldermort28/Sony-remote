export const SONY_IRCC_CODES = {
  // Power
  Power: 'AAAAAQAAAAEAAAAVAw==',
  PowerOff: 'AAAAAQAAAAEAAAAvAw==',
  Standby: 'AAAAAQAAAAEAAAA5Aw==',

  // Navigation
  Up: 'AAAAAQAAAAEAAAB0Aw==',
  Down: 'AAAAAQAAAAEAAAB1Aw==',
  Left: 'AAAAAQAAAAEAAAA0Aw==',
  Right: 'AAAAAQAAAAEAAAAzAw==',
  Confirm: 'AAAAAQAAAAEAAABlAw==',
  Home: 'AAAAAQAAAAEAAABgAw==',
  Return: 'AAAAAQAAAAEAAABjAw==',
  Exit: 'AAAAAQAAAAEAAABjAw==',
  Options: 'AAAAAgAAAJcAAAA2Aw==',
  ActionMenu: 'AAAAAgAAAMQAAABLAw==',
  Help: 'AAAAAgAAAMQAAABNAw==',
  Display: 'AAAAAQAAAAEAAAA6Aw==',

  // Volume & Audio
  VolumeUp: 'AAAAAQAAAAEAAAASAw==',
  VolumeDown: 'AAAAAQAAAAEAAAATAw==',
  Mute: 'AAAAAQAAAAEAAAAUAw==',
  Audio: 'AAAAAQAAAAEAAAAXAw==',

  // Channels
  ChannelUp: 'AAAAAQAAAAEAAAAQAw==',
  ChannelDown: 'AAAAAQAAAAEAAAARAw==',
  PrevChannel: 'AAAAAQAAAAEAAAB2Aw==',

  // Media Controls
  Play: 'AAAAAgAAAJcAAAAaAw==',
  Pause: 'AAAAAgAAAJcAAAAZAw==',
  Stop: 'AAAAAgAAAJcAAAAYAw==',
  Rewind: 'AAAAAgAAAJcAAAAbAw==',
  FastForward: 'AAAAAgAAAJcAAAAcAw==',
  Prev: 'AAAAAgAAAJcAAAA8Aw==',
  Next: 'AAAAAgAAAJcAAAA9Aw==',

  // Inputs
  Input: 'AAAAAQAAAAEAAAAlAw==',
  Hdmi1: 'AAAAAgAAABoAAABaAw==',
  Hdmi2: 'AAAAAgAAABoAAABbAw==',
  Hdmi3: 'AAAAAgAAABoAAABcAw==',
  Hdmi4: 'AAAAAgAAABoAAABdAw==',

  // Color Keys
  Red: 'AAAAAgAAAJcAAAAlAw==',
  Green: 'AAAAAgAAAJcAAAAmAw==',
  Yellow: 'AAAAAgAAAJcAAAAnAw==',
  Blue: 'AAAAAgAAAJcAAAAkAw==',

  // Digits (0 - 9)
  Num1: 'AAAAAQAAAAEAAAAAAw==',
  Num2: 'AAAAAQAAAAEAAAABAw==',
  Num3: 'AAAAAQAAAAEAAAACAw==',
  Num4: 'AAAAAQAAAAEAAAADAw==',
  Num5: 'AAAAAQAAAAEAAAAEAw==',
  Num6: 'AAAAAQAAAAEAAAAFAw==',
  Num7: 'AAAAAQAAAAEAAAAGAw==',
  Num8: 'AAAAAQAAAAEAAAAHAw==',
  Num9: 'AAAAAQAAAAEAAAAIAw==',
  Num0: 'AAAAAQAAAAEAAAAJAw==',
  Dot: 'AAAAAgAAAJcAAAAvAw==',
  Enter: 'AAAAAQAAAAEAAABlAw==',
  SubTitle: 'AAAAAgAAAJcAAAAoAw==',

  // Shortcuts
  Netflix: 'AAAAAgAAABoAAAB8Aw==',
  YouTube: 'AAAAAgAAAMQAAABHAw==',
  GooglePlay: 'AAAAAgAAAMQAAABGAw==',
} as const;

export type IrccKey = keyof typeof SONY_IRCC_CODES;
