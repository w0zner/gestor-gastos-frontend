export enum TypeResponse {
    OK = "OK",
    ERROR = "ERROR",
    WARNING = "WARNING",
    INFO = "INFO"
}

export interface OperationResponse {
    type: TypeResponse.OK | TypeResponse.ERROR | TypeResponse.WARNING | TypeResponse.INFO,
    message: string
    object?: any
}

export function buildResponse(type: TypeResponse.OK | TypeResponse.ERROR | TypeResponse.WARNING | TypeResponse.INFO = TypeResponse.ERROR, message: string = "No se pudo completar la operación", object?: any): OperationResponse {
    return { type, message, object };
}