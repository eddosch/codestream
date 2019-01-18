"use strict";
import {
	FetchUsersRequest,
	FetchUsersRequestType,
	FetchUsersResponse,
	GetMeRequestType,
	GetMeResponse,
	GetPreferencesRequestType,
	GetPreferencesResponse,
	GetUnreadsRequest,
	GetUnreadsRequestType,
	GetUnreadsResponse,
	GetUserRequest,
	GetUserRequestType,
	GetUserResponse,
	InviteUserRequest,
	InviteUserRequestType,
	UpdatePreferencesRequest,
	UpdatePreferencesRequestType,
	UpdatePresenceRequest,
	UpdatePresenceRequestType
} from "../shared/agent.protocol";
import { CSUser } from "../shared/api.protocol";
import { lsp, lspHandler } from "../system";
import { CachedEntityManagerBase, Id } from "./entityManager";

@lsp
export class UsersManager extends CachedEntityManagerBase<CSUser> {
	@lspHandler(FetchUsersRequestType)
	async get(request?: FetchUsersRequest): Promise<FetchUsersResponse> {
		let users = await this.ensureCached();
		if (request != null) {
			if (request.userIds != null && request.userIds.length !== 0) {
				users = users.filter(u => request.userIds!.includes(u.id));
			}
		}

		return { users: users };
	}

	protected async loadCache() {
		const response = await this.session.api.fetchUsers({});
		this.cache.set(response.users);
	}

	async getByEmails(
		emails: string[],
		options: { ignoreCase?: boolean } = { ignoreCase: true }
	): Promise<CSUser[]> {
		if (options.ignoreCase) {
			emails = emails.map(email => email.toLocaleUpperCase());
		}

		const users = (await this.get()).users;
		return users.filter(u =>
			emails.includes(options.ignoreCase ? u.email.toLocaleUpperCase() : u.email)
		);
	}

	protected async fetchById(userId: Id): Promise<CSUser> {
		const response = await this.session.api.getUser({ userId: userId });
		return response.user;
	}

	@lspHandler(InviteUserRequestType)
	inviteUser(request: InviteUserRequest) {
		return this.session.api.inviteUser(request);
	}

	// TODO: return preferences instead of user
	@lspHandler(UpdatePreferencesRequestType)
	updatePreferences(request: UpdatePreferencesRequest) {
		return this.session.api.updatePreferences(request);
	}

	@lspHandler(UpdatePresenceRequestType)
	updatePresence(request: UpdatePresenceRequest) {
		return this.session.api.updatePresence(request);
	}

	@lspHandler(GetMeRequestType)
	async getMe(): Promise<GetMeResponse> {
		const me = (await this.session.api.getMe()).user;
		return { user: me };
	}

	@lspHandler(GetUnreadsRequestType)
	protected getUnreads(request: GetUnreadsRequest): Promise<GetUnreadsResponse> {
		return this.session.api.getUnreads(request);
	}

	@lspHandler(GetUserRequestType)
	protected async getUser(request: GetUserRequest): Promise<GetUserResponse> {
		const user = await this.getById(request.userId);
		return { user: user };
	}

	@lspHandler(GetPreferencesRequestType)
	protected async getPreferences(): Promise<GetPreferencesResponse> {
		return this.session.api.getPreferences();
	}

	protected getEntityName(): string {
		return "User";
	}
}
