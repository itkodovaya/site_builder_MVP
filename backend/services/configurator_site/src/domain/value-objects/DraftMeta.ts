/**
 * DraftMeta Value Object
 * Represents draft metadata for tracking
 */

export interface DraftMetaProps {
  ipHash?: string;
  userAgentHash?: string;
  source?: string;
  notes?: string;
}

export class DraftMeta {
  private constructor(private readonly props: DraftMetaProps) {}

  static create(props: DraftMetaProps = {}): DraftMeta {
    return new DraftMeta({
      source: props.source || 'web',
      ipHash: props.ipHash,
      userAgentHash: props.userAgentHash,
      notes: props.notes,
    });
  }

  getIpHash(): string | undefined {
    return this.props.ipHash;
  }

  getUserAgentHash(): string | undefined {
    return this.props.userAgentHash;
  }

  getSource(): string | undefined {
    return this.props.source;
  }

  getNotes(): string | undefined {
    return this.props.notes;
  }

  toJSON() {
    return {
      ipHash: this.props.ipHash,
      userAgentHash: this.props.userAgentHash,
      source: this.props.source,
      notes: this.props.notes,
    };
  }

  static fromJSON(json: any): DraftMeta {
    return DraftMeta.create({
      ipHash: json.ipHash,
      userAgentHash: json.userAgentHash,
      source: json.source,
      notes: json.notes,
    });
  }
}

