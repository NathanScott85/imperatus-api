import multer from "multer";
import { Request, Response } from "express";

const storage = multer.memoryStorage(); // Store file in memory

const upload = multer({ storage });

interface MulterRequest extends Request {
  file: Express.Multer.File;
}

export class UploadService {
  public async handleUpload(
    req: MulterRequest,
    res: Response
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      upload.single("file")(req, res, (err: any) => {
        if (err) {
          return reject(err);
        }
        if (!req.file) {
          return reject(new Error("No file uploaded"));
        }
        resolve(req.file.buffer);
      });
    });
  }

  public convertToBase64(buffer: Buffer): string {
    return buffer.toString("base64");
  }

  public async processUpload(
    req: MulterRequest,
    res: Response
  ): Promise<string> {
    try {
      const fileBuffer = await this.handleUpload(req, res);
      const base64String = this.convertToBase64(fileBuffer);
      return base64String;
    } catch (error) {
      const errorMessage = (error as Error).message;
      throw new Error(`File upload failed: ${errorMessage}`);
    }
  }
}

export default new UploadService();
