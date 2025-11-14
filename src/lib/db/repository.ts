import { pgUserRepository } from "./pg/repositories/user-repository.pg";
import {
  roleTemplateRepository,
  projectRoleRepository,
  projectUserRepository,
  projectUserAgentRepository,
} from "./repositories/rbac-repositories";

export const userRepository = pgUserRepository;
export {
  roleTemplateRepository,
  projectRoleRepository,
  projectUserRepository,
  projectUserAgentRepository,
};
