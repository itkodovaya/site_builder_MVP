/**
 * BrandProfile Entity
 * Represents brand information with logo
 */

import { BrandName } from '../value-objects/BrandName';
import { IndustryInfo } from '../value-objects/IndustryInfo';
import { AssetInfo } from '../value-objects/AssetInfo';

export interface BrandProfileProps {
  schemaVersion: number;
  brandName: BrandName;
  industry: IndustryInfo;
  logo?: AssetInfo;
}

export class BrandProfile {
  private constructor(private readonly props: BrandProfileProps) {
    this.validate();
  }

  static create(params: {
    brandName: string;
    industryCode: string;
    industryLabel?: string;
    logo?: AssetInfo;
  }): BrandProfile {
    return new BrandProfile({
      schemaVersion: 1,
      brandName: BrandName.create(params.brandName),
      industry: IndustryInfo.create(params.industryCode, params.industryLabel),
      logo: params.logo,
    });
  }

  static reconstitute(props: BrandProfileProps): BrandProfile {
    return new BrandProfile(props);
  }

  update(params: {
    brandName?: string;
    industryCode?: string;
    industryLabel?: string;
    logo?: AssetInfo;
  }): BrandProfile {
    return new BrandProfile({
      ...this.props,
      brandName: params.brandName 
        ? BrandName.create(params.brandName)
        : this.props.brandName,
      industry: params.industryCode
        ? IndustryInfo.create(params.industryCode, params.industryLabel)
        : this.props.industry,
      logo: params.logo !== undefined ? params.logo : this.props.logo,
    });
  }

  getSchemaVersion(): number {
    return this.props.schemaVersion;
  }

  getBrandName(): BrandName {
    return this.props.brandName;
  }

  getIndustry(): IndustryInfo {
    return this.props.industry;
  }

  getLogo(): AssetInfo | undefined {
    return this.props.logo;
  }

  toJSON() {
    return {
      schemaVersion: this.props.schemaVersion,
      brandName: this.props.brandName.toString(),
      industry: this.props.industry.toJSON(),
      logo: this.props.logo?.toJSON(),
    };
  }

  static fromJSON(json: any): BrandProfile {
    return BrandProfile.create({
      brandName: json.brandName,
      industryCode: json.industry.code,
      industryLabel: json.industry.label,
      logo: json.logo ? AssetInfo.fromJSON(json.logo) : undefined,
    });
  }

  private validate(): void {
    if (!this.props.brandName) {
      throw new Error('BrandProfile must have a brand name');
    }
    if (!this.props.industry) {
      throw new Error('BrandProfile must have an industry');
    }
  }
}

