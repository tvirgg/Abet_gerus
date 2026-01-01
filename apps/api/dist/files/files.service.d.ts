import { OnModuleInit } from '@nestjs/common';
export declare class FilesService implements OnModuleInit {
    private minioClient;
    private bucketName;
    constructor();
    onModuleInit(): Promise<void>;
    uploadFile(file: any): Promise<string>;
    getFileStream(objectName: string): Promise<import("stream").Readable>;
}
