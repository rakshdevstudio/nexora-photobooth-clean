export interface PrintEngine {
  print(html: string): Promise<void>;
}
