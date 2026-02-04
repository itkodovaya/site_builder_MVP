/**
 * GeneratorInfo Value Object
 * Represents generator metadata
 */

export interface GeneratorInfoProps {
  engine: string;
  engineVersion: string;
  templateId: string;
  locale?: string;
}

export class GeneratorInfo {
  private constructor(private readonly props: GeneratorInfoProps) {
    this.validate();
  }

  static create(props: GeneratorInfoProps): GeneratorInfo {
    return new GeneratorInfo({
      engine: props.engine,
      engineVersion: props.engineVersion,
      templateId: props.templateId,
      locale: props.locale || 'ru-RU',
    });
  }

  static default(): GeneratorInfo {
    return new GeneratorInfo({
      engine: 'configurator_site',
      engineVersion: '0.1.0',
      templateId: 'default',
      locale: 'ru-RU',
    });
  }

  getEngine(): string {
    return this.props.engine;
  }

  getEngineVersion(): string {
    return this.props.engineVersion;
  }

  getTemplateId(): string {
    return this.props.templateId;
  }

  getLocale(): string {
    return this.props.locale || 'ru-RU';
  }

  toJSON() {
    return {
      engine: this.props.engine,
      engineVersion: this.props.engineVersion,
      templateId: this.props.templateId,
      locale: this.props.locale,
    };
  }

  static fromJSON(json: any): GeneratorInfo {
    return GeneratorInfo.create({
      engine: json.engine,
      engineVersion: json.engineVersion,
      templateId: json.templateId,
      locale: json.locale,
    });
  }

  private validate(): void {
    if (!this.props.engine) {
      throw new Error('Generator engine is required');
    }
    if (!this.props.engineVersion) {
      throw new Error('Generator engineVersion is required');
    }
    if (!this.props.templateId) {
      throw new Error('Generator templateId is required');
    }
  }
}

