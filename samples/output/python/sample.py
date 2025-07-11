from typing import Any, Dict
import nexusrpc

from pydantic import BaseModel
from typing import Optional


class GetPersonResponse(BaseModel):
  """A simple person schema
  
  Response containing person details.
  """
  age: int
  """The person's age"""

  id: str
  """The person's identifier"""

  name: str
  """The person's name"""

  email: Optional[str] = None
  """The person's email address"""


class GetPersonRequest(BaseModel):
  """Request to retrieve a person by their user ID."""

  user_id: str
  """The unique identifier of the user."""


class NoInputRequest(BaseModel):
  message: str
  """The message to send."""


class NoInputResponse(BaseModel):
  message: str
  """The message to send."""


@nexusrpc.service
class Userservice:
    """
    Service for managing users.
    """

    get_user: nexusrpc.Operation[GetPersonRequest, GetPersonResponse] = nexusrpc.Operation(name="Get User")
    """
    Retrieves a user by their ID.
    """


@nexusrpc.service
class Onewayservice:
    """
    Sample service for testing one-way operations.
    """

    no_input: nexusrpc.Operation[None, NoInputResponse] = nexusrpc.Operation(name="noInput")
    """
    Operation for noInput.
    """

    no_output: nexusrpc.Operation[NoInputRequest, None] = nexusrpc.Operation(name="noOutput")
    """
    Operation for noOutput.
    """


