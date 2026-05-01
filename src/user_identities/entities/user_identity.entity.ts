export class UserIdentity {
  // i want to add id , user id , provider provider_user_id, emtail , phone number, created at, updated at to the user identity entity. The id should be a primary column that is generated using nanoid10. The user id should be a foreign key that references the id of the user entity. The provider should be a string that indicates the provider of the identity (e.g. google, facebook, etc.). The provider_user_id should be a string that indicates the user id provided by the provider. The email should be a string that indicates the email of the user. The phone number should be a string that indicates the phone number of the user. The created at and updated at should be date columns that indicate when the identity was created and updated.
  // i also want to add a unique constraint on the combination of provider and provider_user_id to ensure that there are no duplicate identities for the same provider and user id.

}
