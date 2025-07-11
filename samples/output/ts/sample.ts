import * as nexus from "nexus-rpc"

/**
 * A simple person schema
 *
 * Response containing person details.
 */
export interface GetPersonResponse {
  /**
   * The person's age
   */
  age: number;
  /**
   * The person's email address
   */
  email?: string;
  /**
   * The person's identifier
   */
  id: string;
  /**
   * The person's name
   */
  name: string;
  [property: string]: any;
}

/**
 * Request to retrieve a person by their user ID.
 */
export interface GetPersonRequest {
  /**
   * The unique identifier of the user.
   */
  userId: string;
  [property: string]: any;
}

export interface NoInputRequest {
  /**
   * The message to send.
   */
  message: string;
  [property: string]: any;
}

export interface NoInputResponse {
  /**
   * The message to send.
   */
  message: string;
  [property: string]: any;
}


/**
 * Service for managing users.
 */
export const UserService = nexus.service("directory.UserService", {
  /**
   * Retrieves a user by their ID.
   */
  getUser: nexus.operation<object, object>({
    name: "Get User",
  }),
});

/**
 * Sample service for testing one-way operations.
 */
export const OneWayService = nexus.service("OneWayService", {
  /**
   * Represents the noInput operation.
   */
  noInput: nexus.operation<void, object>({
    name: "noInput",
  }),
  /**
   * Represents the noOutput operation.
   */
  noOutput: nexus.operation<object, void>({
    name: "noOutput",
  }),
});

