"use strict";
import {
	FetchTeamsRequest,
	FetchTeamsRequestType,
	FetchTeamsResponse,
	GetTeamRequest,
	GetTeamRequestType,
	GetTeamResponse
} from "../shared/agent.protocol";
import { CSTeam } from "../shared/api.protocol";
import { lsp, lspHandler } from "../system";
import { CachedEntityManagerBase, Id } from "./entityManager";

@lsp
export class TeamsManager extends CachedEntityManagerBase<CSTeam> {
	@lspHandler(FetchTeamsRequestType)
	async get(request?: FetchTeamsRequest): Promise<FetchTeamsResponse> {
		let teams = await this.ensureCached();
		if (request != null) {
			if (request.teamIds != null && request.teamIds.length !== 0) {
				teams = teams.filter(t => request.teamIds!.includes(t.id));
			}
		}

		return { teams: teams };
	}

	protected async loadCache() {
		const response = await this.session.api.fetchTeams({ mine: true });
		this.cache.set(response.teams);
	}

	protected async fetchById(teamId: Id): Promise<CSTeam> {
		const response = await this.session.api.getTeam({ teamId: teamId });
		return response.team;
	}

	@lspHandler(GetTeamRequestType)
	protected async getTeam(request: GetTeamRequest): Promise<GetTeamResponse> {
		const team = await this.getById(request.teamId);
		return { team: team };
	}

	protected getEntityName(): string {
		return "Team";
	}
}
