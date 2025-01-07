import AWS from "aws-sdk";

class S3Service {
  private s3: AWS.S3;
  private bucketName: string;

  constructor() {
    this.s3 = new AWS.S3( {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    } );

    this.bucketName = process.env.S3_BUCKET_NAME as string;
    if ( !this.bucketName ) {
      throw new Error( "S3 bucket name is not set in environment variables." );
    }
  }

  public async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<{ s3Url: string; key: string }> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    };

    try {
      const data = await this.s3.upload( params ).promise();
      return { s3Url: data.Location, key: fileName };
    } catch ( error ) {
      console.error( "Error uploading file to S3:", error );
      throw new Error( "Error uploading file to S3" );
    }
  }

  public async deleteFile( fileKey: string ): Promise<void> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: this.bucketName,
      Key: fileKey,
    };

    try {
      await this.s3.deleteObject( params ).promise();
    } catch ( error ) {
      console.error( "Error deleting file from S3:", error );
      throw new Error( "Error deleting file from S3" );
    }
  }
}

export default new S3Service();
