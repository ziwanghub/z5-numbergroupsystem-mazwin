export interface WorkspacePanelConfig {
    panelId: string;
    title: string;
    formulaId: string;
    formulaVersion: string;
    params: Record<string, unknown>;
    layout?: {
        order?: number;
        width?: number;
        height?: number;
    };
}

export interface WorkspaceConfig {
    version: string;
    panels: WorkspacePanelConfig[];
    updatedAt: string;
}
