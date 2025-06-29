export interface MegaAccount {
	email: string;
	password: string;
	storage: any;
}

export interface MegaConfig {
	accounts: string;
}

export interface ServerConfig {
	port: number;
	maxFileSize: number;
	maxFiles: number;
	allowedTypes: string[];
	cacheTTL: number;
}

export interface RateLimitConfig {
	max: number;
	timeWindow: string;
}

export interface AuthConfig {
	enable: boolean;
	keys: string[];
}

export interface AutoDeleteConfig {
	enable: boolean;
	minutes: number;
	mongodb?: string | null;
}

export interface Config {
	mega: MegaConfig;
	server: ServerConfig;
	rateLimit: RateLimitConfig;
	auth: AuthConfig;
	autoDelete: AutoDeleteConfig;
	storage: "file" | "memory";
	DATABASE_URL?: string | undefined;
	FILENAMES?: boolean;
}

export interface FileUpload {
	filename: string;
	stream: NodeJS.ReadableStream;
	mime: string;
}

export interface UploadResult {
	name: string;
	size: number;
	mime: string;
	url: string;
}

export interface FileDeleteRecord {
	fileName: string;
	deleteTime: number;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface CustomFileRecord {
	customFileName: string;
	originalMegaUrl: string;
	fileExtension: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface DatabaseConnector {
	connect(): Promise<boolean>;
	disconnect(): Promise<void>;
	save(data: FileDeleteRecord): Promise<any>;
	get(fileName: string): Promise<any>;
	update(fileName: string, data: Partial<FileDeleteRecord>): Promise<boolean>;
	delete(fileName: string): Promise<boolean>;
	findExpired(currentTime: number): Promise<any[]>;
	isConnected: boolean;
	saveCustomFile?(data: CustomFileRecord): Promise<any>;
	getCustomFile?(customFileName: string): Promise<any>;
	deleteCustomFile?(customFileName: string): Promise<boolean>;
}

export interface UploadResponse {
	success: boolean;
	files: Array<{
		url: string;
		name: string;
		size: number;
		formattedSize: string;
		mime: string;
		expires?: string;
		formattedExpires?: string;
	}>;
}

export interface InfoResponse {
	request_limit: number;
	rate_limit: string;
	file_size: number;
	max_files: number;
	auto_delete_time?: number;
}

export interface BatchResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	deleted?: boolean;
}

export type DatabaseType = "postgres" | "sqlite" | "mongodb";
export type UploadMode = "single" | "dual";

export interface UploadQuery {
	email?: string;
}

export interface DetectedFileType {
	ext: string;
	mime: string;
}

export type FormatBytesFunction = (bytes: number) => string;
export type RuntimeFunction = (seconds: number) => string;

declare module "fastify" {
	interface FastifyRequest {
		parts(): AsyncIterableIterator<any>;
	}
}

