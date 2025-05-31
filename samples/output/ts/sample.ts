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

export const UserService = nexus.service("directory.UserService", {
  getUser: nexus.operation<GetPersonRequest, GetPersonResponse>({
    name: "Get User",
  }),
});
