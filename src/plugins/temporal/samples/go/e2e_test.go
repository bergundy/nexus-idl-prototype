package example

import (
	"context"
	"testing"

	"github.com/bergundy/nexus-idl/samples/temporal/go/gen"

	"github.com/nexus-rpc/sdk-go/nexus"
	"github.com/stretchr/testify/require"
	nexuspb "go.temporal.io/api/nexus/v1"
	operatorservice "go.temporal.io/api/operatorservice/v1"
	"go.temporal.io/sdk/client"
	"go.temporal.io/sdk/testsuite"
	"go.temporal.io/sdk/worker"
	"go.temporal.io/sdk/workflow"
)

var userServiceClient = gen.NewUserServiceWorkflowClient("example-endpoint")

func CallerWorkflow(ctx workflow.Context) (*gen.GetPersonResponse, error) {
	output, err := userServiceClient.GetUser(ctx, &gen.GetPersonRequest{UserID: "123"}, workflow.NexusOperationOptions{})
	if err != nil {
		return nil, err
	}

	return output, nil
}

type userServiceHandler struct {
	gen.UnimplementedUserServiceHandler
}

func (*userServiceHandler) GetUser(name string) nexus.Operation[*gen.GetPersonRequest, *gen.GetPersonResponse] {
	return nexus.NewSyncOperation(name, func(ctx context.Context, r *gen.GetPersonRequest, options nexus.StartOperationOptions) (*gen.GetPersonResponse, error) {
		return &gen.GetPersonResponse{Name: "bar"}, nil
	})
}

func TestE2E(t *testing.T) {
	ctx := context.Background()
	srv, err := testsuite.StartDevServer(ctx, testsuite.DevServerOptions{})

	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, srv.Stop()) })

	c := srv.Client()
	require.NoError(t, err)
	w := worker.New(c, "example", worker.Options{})
	userService, err := gen.NewUserService(&userServiceHandler{})
	require.NoError(t, err)
	w.RegisterNexusService(userService)
	w.RegisterWorkflow(CallerWorkflow)

	_, err = c.OperatorService().CreateNexusEndpoint(ctx, &operatorservice.CreateNexusEndpointRequest{
		Spec: &nexuspb.EndpointSpec{
			Name: "example-endpoint",
			Target: &nexuspb.EndpointTarget{
				Variant: &nexuspb.EndpointTarget_Worker_{
					Worker: &nexuspb.EndpointTarget_Worker{
						Namespace: "default",
						TaskQueue: "example",
					},
				},
			},
		},
	})
	require.NoError(t, err)

	require.NoError(t, w.Start())
	t.Cleanup(w.Stop)

	fut, err := c.ExecuteWorkflow(ctx, client.StartWorkflowOptions{
		TaskQueue: "example",
	}, CallerWorkflow)
	require.NoError(t, err)
	require.NoError(t, fut.Get(ctx, nil))
}
