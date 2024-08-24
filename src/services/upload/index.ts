import multer from "multer";
import { Request, Response } from "express";
import S3Service from "../amazon";

const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage });

interface MulterRequest extends Request {
  file: Express.Multer.File;
}

export class UploadService {
  public async handleUpload(
    req: MulterRequest,
    res: Response
  ): Promise<{
    s3Url: string;
    key: string;
    fileName: string;
    contentType: string;
  }> {
    return new Promise((resolve, reject) => {
      upload.single("file")(req, res, async (err: any) => {
        if (err) {
          return reject(err);
        }
        if (!req.file) {
          return reject(new Error("No file uploaded"));
        }

        try {
          const { originalname, buffer, mimetype, size } = req.file;

          // Upload to S3
          const { s3Url, key } = await S3Service.uploadFile(
            buffer,
            originalname,
            mimetype
          );
          resolve({
            s3Url,
            key,
            fileName: originalname,
            contentType: mimetype,
          });
        } catch (uploadError) {
          reject(uploadError);
        }
      });
    });
  }

  public async processUpload(
    stream: NodeJS.ReadableStream,
    filename: string,
    mimetype: string
  ): Promise<{
    s3Url: string;
    key: string;
    fileName: string;
    contentType: string;
  }> {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      // Upload to S3
      const { s3Url, key } = await S3Service.uploadFile(
        buffer,
        filename,
        mimetype
      );
      return {
        s3Url,
        key,
        fileName: filename,
        contentType: mimetype,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      throw new Error(`File upload failed: ${errorMessage}`);
    }
  }

  public async deleteFileFromS3(key: string): Promise<void> {
    try {
      await S3Service.deleteFile(key);
    } catch (error) {
      const errorMessage = (error as Error).message;
      throw new Error(`File deletion failed: ${errorMessage}`);
    }
  }
}

export default new UploadService();
