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

type NoInputRequest struct {
  // The message to send.       
  Message                string `json:"message"`
}

type NoInputResponse struct {
  // The message to send.       
  Message                string `json:"message"`
}


// UserServiceServiceName Service for managing users.
const UserServiceServiceName = "directory.UserService"


// UserServiceGetUserOperationName Retrieves a user by their ID.
const UserServiceGetUserOperationName = "Get User"

// UserServiceGetUserOperation Retrieves a user by their ID.
var UserServiceGetUserOperation = nexus.NewOperationReference[*GetPersonRequest, *GetPersonResponse](UserServiceGetUserOperationName)

// UserServiceHandler defines the handler interface for the UserService service.
type UserServiceHandler interface {
	GetUser(name string) nexus.Operation[*GetPersonRequest, *GetPersonResponse]
}

// UnimplementedUserServiceHandler provides an unimplemented version of UserServiceHandler.
type UnimplementedUserServiceHandler struct{}

// unimplementedUserServiceGetUser provides an unimplemented GetUser operation.
type unimplementedUserServiceGetUser struct {
	nexus.UnimplementedOperation[*GetPersonRequest, *GetPersonResponse]
	name string
}

func (op *unimplementedUserServiceGetUser) Name() string {
	return op.name
}

// GetUser returns an unimplemented operation.
func (UnimplementedUserServiceHandler) GetUser(name string) nexus.Operation[*GetPersonRequest, *GetPersonResponse] {
	return &unimplementedUserServiceGetUser{name: name}
}

// NewUserService creates a new UserService service from a handler with all operations registered.
func NewUserService(handler UserServiceHandler) (*nexus.Service, error) {
	service := nexus.NewService(UserServiceServiceName)

	if err := service.Register(handler.GetUser(UserServiceGetUserOperationName)); err != nil {
		return nil, err
	}

	return service, nil
}

// OneWayServiceServiceName Sample service for testing one-way operations.
const OneWayServiceServiceName = "OneWayService"


// OneWayServiceNoInputOperationName represents the noInput operation.
const OneWayServiceNoInputOperationName = "noInput"

// OneWayServiceNoInputOperation represents the noInput operation.
var OneWayServiceNoInputOperation = nexus.NewOperationReference[nexus.NoValue, *NoInputResponse](OneWayServiceNoInputOperationName)


// OneWayServiceNoOutputOperationName represents the noOutput operation.
const OneWayServiceNoOutputOperationName = "noOutput"

// OneWayServiceNoOutputOperation represents the noOutput operation.
var OneWayServiceNoOutputOperation = nexus.NewOperationReference[*NoInputRequest, nexus.NoValue](OneWayServiceNoOutputOperationName)

// OneWayServiceHandler defines the handler interface for the OneWayService service.
type OneWayServiceHandler interface {
	NoInput(name string) nexus.Operation[nexus.NoValue, *NoInputResponse]
	NoOutput(name string) nexus.Operation[*NoInputRequest, nexus.NoValue]
}

// UnimplementedOneWayServiceHandler provides an unimplemented version of OneWayServiceHandler.
type UnimplementedOneWayServiceHandler struct{}

// unimplementedOneWayServiceNoInput provides an unimplemented NoInput operation.
type unimplementedOneWayServiceNoInput struct {
	nexus.UnimplementedOperation[nexus.NoValue, *NoInputResponse]
	name string
}

func (op *unimplementedOneWayServiceNoInput) Name() string {
	return op.name
}

// unimplementedOneWayServiceNoOutput provides an unimplemented NoOutput operation.
type unimplementedOneWayServiceNoOutput struct {
	nexus.UnimplementedOperation[*NoInputRequest, nexus.NoValue]
	name string
}

func (op *unimplementedOneWayServiceNoOutput) Name() string {
	return op.name
}

// NoInput returns an unimplemented operation.
func (UnimplementedOneWayServiceHandler) NoInput(name string) nexus.Operation[nexus.NoValue, *NoInputResponse] {
	return &unimplementedOneWayServiceNoInput{name: name}
}

// NoOutput returns an unimplemented operation.
func (UnimplementedOneWayServiceHandler) NoOutput(name string) nexus.Operation[*NoInputRequest, nexus.NoValue] {
	return &unimplementedOneWayServiceNoOutput{name: name}
}

// NewOneWayService creates a new OneWayService service from a handler with all operations registered.
func NewOneWayService(handler OneWayServiceHandler) (*nexus.Service, error) {
	service := nexus.NewService(OneWayServiceServiceName)

	if err := service.Register(handler.NoInput(OneWayServiceNoInputOperationName)); err != nil {
		return nil, err
	}

	if err := service.Register(handler.NoOutput(OneWayServiceNoOutputOperationName)); err != nil {
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
func (f UserServiceGetUserFuture) GetTyped(ctx workflow.Context) (*GetPersonResponse, error) {
	var output *GetPersonResponse
	err := f.Get(ctx, &output)
	return output, err
}

// GetUserAsync executes the Get User operation and returns a future.
func (c *UserServiceWorkflowClient) GetUserAsync(ctx workflow.Context, input *GetPersonRequest, options workflow.NexusOperationOptions) UserServiceGetUserFuture {
	fut := c.c.ExecuteOperation(ctx, UserServiceGetUserOperationName, input, options)
	return UserServiceGetUserFuture{fut}
}

// GetUser executes the Get User operation and returns the result.
func (c *UserServiceWorkflowClient) GetUser(ctx workflow.Context, input *GetPersonRequest, options workflow.NexusOperationOptions) (*GetPersonResponse, error) {
	fut := c.GetUserAsync(ctx, input, options)
	return fut.GetTyped(ctx)
}

// OneWayServiceWorkflowClient is an in-workflow Nexus client for the OneWayService service.
type OneWayServiceWorkflowClient struct {
	c workflow.NexusClient
}

// NewOneWayServiceWorkflowClient creates a new in-workflow Nexus client for the OneWayService service.
func NewOneWayServiceWorkflowClient(endpoint string) *OneWayServiceWorkflowClient {
	c := workflow.NewNexusClient(endpoint, OneWayServiceServiceName)
	return &OneWayServiceWorkflowClient{c}
}

// OneWayServiceNoInputFuture is a future for the noInput operation.
type OneWayServiceNoInputFuture struct {
	workflow.NexusOperationFuture
}

// GetTyped gets the typed result of the operation.
func (f OneWayServiceNoInputFuture) GetTyped(ctx workflow.Context) (*NoInputResponse, error) {
	var output *NoInputResponse
	err := f.Get(ctx, &output)
	return output, err
}

// NoInputAsync executes the noInput operation and returns a future.
func (c *OneWayServiceWorkflowClient) NoInputAsync(ctx workflow.Context, options workflow.NexusOperationOptions) OneWayServiceNoInputFuture {
	fut := c.c.ExecuteOperation(ctx, OneWayServiceNoInputOperationName, nil, options)
	return OneWayServiceNoInputFuture{fut}
}

// NoInput executes the noInput operation and returns the result.
func (c *OneWayServiceWorkflowClient) NoInput(ctx workflow.Context, options workflow.NexusOperationOptions) (*NoInputResponse, error) {
	fut := c.NoInputAsync(ctx, options)
	return fut.GetTyped(ctx)
}

// OneWayServiceNoOutputFuture is a future for the noOutput operation.
type OneWayServiceNoOutputFuture struct {
	workflow.NexusOperationFuture
}

// GetTyped gets the typed result of the operation.
func (f OneWayServiceNoOutputFuture) GetTyped(ctx workflow.Context) error {
	return f.Get(ctx, nil)
}

// NoOutputAsync executes the noOutput operation and returns a future.
func (c *OneWayServiceWorkflowClient) NoOutputAsync(ctx workflow.Context, input *NoInputRequest, options workflow.NexusOperationOptions) OneWayServiceNoOutputFuture {
	fut := c.c.ExecuteOperation(ctx, OneWayServiceNoOutputOperationName, input, options)
	return OneWayServiceNoOutputFuture{fut}
}

// NoOutput executes the noOutput operation and returns the result.
func (c *OneWayServiceWorkflowClient) NoOutput(ctx workflow.Context, input *NoInputRequest, options workflow.NexusOperationOptions) error {
	fut := c.NoOutputAsync(ctx, input, options)
	return fut.GetTyped(ctx)
}

