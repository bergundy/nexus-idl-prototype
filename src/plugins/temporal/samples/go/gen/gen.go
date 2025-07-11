package gen

import "github.com/nexus-rpc/sdk-go/nexus"
import "go.temporal.io/sdk/workflow"

// A simple person schema
//
// Response containing person details.
type GetPersonResponse struct {
  // The person's age                  
  Age                          int64   `json:"age"`
  // The person's email address        
  Email                        *string `json:"email,omitempty"`
  // The person's identifier           
  ID                           string  `json:"id"`
  // The person's name                 
  Name                         string  `json:"name"`
}

// Request to retrieve a person by their user ID.
type GetPersonRequest struct {
  // The unique identifier of the user.       
  UserID                               string `json:"userId"`
}


// UserServiceServiceName Service for managing users.
const UserServiceServiceName = "directory.UserService"


// UserServiceGetUserOperationName Retrieves a user by their ID.
const UserServiceGetUserOperationName = "Get User"

// UserServiceGetUserOperation Retrieves a user by their ID.
var UserServiceGetUserOperation = nexus.NewOperationReference[GetPersonRequest, GetPersonResponse](UserServiceGetUserOperationName)

// UserServiceHandler defines the handler interface for the UserService service.
type UserServiceHandler interface {
	GetUser(name string) nexus.Operation[GetPersonRequest, GetPersonResponse]
}

// UnimplementedUserServiceHandler provides an unimplemented version of UserServiceHandler.
type UnimplementedUserServiceHandler struct{}

// unimplementedUserServiceGetUser provides an unimplemented GetUser operation.
type unimplementedUserServiceGetUser struct {
	nexus.UnimplementedOperation[GetPersonRequest, GetPersonResponse]
	name string
}

func (op *unimplementedUserServiceGetUser) Name() string {
	return op.name
}

// GetUser returns an unimplemented operation.
func (UnimplementedUserServiceHandler) GetUser(name string) nexus.Operation[GetPersonRequest, GetPersonResponse] {
	return &unimplementedUserServiceGetUser{name: name}
}

// NewUserService creates a new UserService service from a handler with all operations registered.
func NewUserService(handler UserServiceHandler) (*nexus.Service, error) {
	service := nexus.NewService(UserServiceServiceName)

	err := service.Register(handler.GetUser(UserServiceGetUserOperationName))
	if err != nil {
		return nil, err
	}

	return service, nil
}

// UserServiceWorkflowClient is an in-workflow Nexus client for the directory.UserService service.
type UserServiceWorkflowClient struct {
	c workflow.NexusClient
}

// NewUserServiceWorkflowClient creates a new in-workflow Nexus client for the directory.UserService service.
func NewUserServiceWorkflowClient(endpoint string) *UserServiceWorkflowClient {
	c := workflow.NewNexusClient(endpoint, UserServiceServiceName)
	return &UserServiceWorkflowClient{c}
}

// UserServiceGetUserFuture is a future for the Get User operation.
type UserServiceGetUserFuture struct {
	workflow.NexusOperationFuture
}

// GetTyped gets the typed result of the operation.
func (f UserServiceGetUserFuture) GetTyped(ctx workflow.Context) (GetPersonResponse, error) {
	var output GetPersonResponse
	err := f.Get(ctx, &output)
	return output, err
}

// GetUserAsync executes the Get User operation and returns a future.
func (c *UserServiceWorkflowClient) GetUserAsync(ctx workflow.Context, input GetPersonRequest, options workflow.NexusOperationOptions) UserServiceGetUserFuture {
	fut := c.c.ExecuteOperation(ctx, UserServiceGetUserOperationName, input, options)
	return UserServiceGetUserFuture{fut}
}

// GetUser executes the Get User operation and returns the result.
func (c *UserServiceWorkflowClient) GetUser(ctx workflow.Context, input GetPersonRequest, options workflow.NexusOperationOptions) (GetPersonResponse, error) {
	fut := c.GetUserAsync(ctx, input, options)
	return fut.GetTyped(ctx)
}

