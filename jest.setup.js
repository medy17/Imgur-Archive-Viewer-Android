/* global jest */

jest.mock("react-native-fs", () => ({
  DownloadDirectoryPath: "/downloads",
  readFile: jest.fn(),
  exists: jest.fn(() => Promise.resolve(false)),
  moveFile: jest.fn(() => Promise.resolve()),
  downloadFile: jest.fn(() => ({
    promise: Promise.resolve({ statusCode: 200 }),
  })),
}));

jest.mock("react-native-file-viewer", () => ({
  open: jest.fn(() => Promise.resolve()),
}));

jest.mock("@react-native-documents/picker", () => ({
  pick: jest.fn(() => Promise.resolve([{ name: "batch.txt", uri: "file:///batch.txt" }])),
  types: {
    plainText: "text/plain",
  },
}));
