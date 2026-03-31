package cnst

type ProtoType string

const (
	BackendProtoSSE        ProtoType = "sse"
	BackendProtoStreamable ProtoType = "streamable-http"
	BackendProtoHttp       ProtoType = "http"
	BackendProtoGrpc       ProtoType = "grpc"
)

const (
	FrontendProtoSSE ProtoType = "sse"
)

func (s ProtoType) String() string {
	return string(s)
}
