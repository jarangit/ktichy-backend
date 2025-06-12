export class CreateUserDto {
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;

  constructor(
    password: string,
    email: string,
    firstName?: string,
    lastName?: string,
    isActive: boolean = true,
  ) {
    this.password = password;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isActive = isActive;
  }
}
