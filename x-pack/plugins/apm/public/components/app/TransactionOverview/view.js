/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiIconTip } from '@elastic/eui';
import styled from 'styled-components';
import chrome from 'ui/chrome';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { HeaderContainer, HeaderMedium } from '../../shared/UIComponents';
import TabNavigation from '../../shared/TabNavigation';
import Charts from '../../shared/charts/TransactionCharts';
import { getMlJobUrl } from '../../../utils/url';
import List from './List';
import { units, px, fontSizes } from '../../../style/variables';
import { OverviewChartsRequest } from '../../../store/reactReduxRequest/overviewCharts';
import { TransactionListRequest } from '../../../store/reactReduxRequest/transactionList';
import { ServiceDetailsRequest } from '../../../store/reactReduxRequest/serviceDetails';

import DynamicBaselineButton from './DynamicBaseline/Button';
import DynamicBaselineFlyout from './DynamicBaseline/Flyout';

function ServiceDetailsAndTransactionList({ urlParams, render }) {
  return (
    <ServiceDetailsRequest
      urlParams={urlParams}
      render={serviceDetails => {
        return (
          <TransactionListRequest
            urlParams={urlParams}
            render={transactionList => {
              return render({
                transactionList: transactionList.data,
                serviceDetails: serviceDetails.data
              });
            }}
          />
        );
      }}
    />
  );
}

const MLTipContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: ${fontSizes.small};
`;

const MLText = styled.div`
  margin-left: ${px(units.half)};
`;

class TransactionOverview extends Component {
  state = {
    isFlyoutOpen: false
  };

  onOpenFlyout = () => this.setState({ isFlyoutOpen: true });
  onCloseFlyout = () => this.setState({ isFlyoutOpen: false });

  render() {
    const {
      changeTransactionSorting,
      hasDynamicBaseline,
      license,
      location,
      transactionSorting,
      urlParams
    } = this.props;

    const { serviceName, transactionType } = urlParams;
    const mlEnabled = chrome.getInjected('mlEnabled');

    const ChartHeaderContent =
      hasDynamicBaseline && license.data.features.ml.isAvailable ? (
        <MLTipContainer>
          <EuiIconTip content="The stream around the average response time shows the expected bounds. An annotation is shown for anomaly scores &gt;= 75." />
          <MLText>
            Machine Learning:{' '}
            <a
              href={getMlJobUrl(
                serviceName,
                transactionType,
                this.props.location
              )}
            >
              View Job
            </a>
          </MLText>
        </MLTipContainer>
      ) : null;

    return (
      <div>
        <HeaderContainer>
          <h1>{serviceName}</h1>
          {license.data.features.ml.isAvailable &&
            mlEnabled && (
              <DynamicBaselineButton onOpenFlyout={this.onOpenFlyout} />
            )}
        </HeaderContainer>

        <DynamicBaselineFlyout
          hasDynamicBaseline={hasDynamicBaseline}
          isOpen={this.state.isFlyoutOpen}
          location={location}
          onClose={this.onCloseFlyout}
          serviceName={serviceName}
          transactionType={transactionType}
        />

        <TabNavigation />

        <OverviewChartsRequest
          urlParams={urlParams}
          render={({ data }) => (
            <Charts
              charts={data}
              urlParams={urlParams}
              location={location}
              ChartHeaderContent={ChartHeaderContent}
            />
          )}
        />

        <HeaderMedium>{transactionTypeLabel(transactionType)}</HeaderMedium>

        <ServiceDetailsAndTransactionList
          urlParams={urlParams}
          render={({ serviceDetails, transactionList }) => {
            return (
              <List
                agentName={serviceDetails.agentName}
                serviceName={serviceName}
                type={transactionType}
                items={transactionList}
                changeTransactionSorting={changeTransactionSorting}
                transactionSorting={transactionSorting}
              />
            );
          }}
        />
      </div>
    );
  }
}

TransactionOverview.propTypes = {
  changeTransactionSorting: PropTypes.func.isRequired,
  hasDynamicBaseline: PropTypes.bool.isRequired,
  license: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  transactionSorting: PropTypes.object.isRequired,
  urlParams: PropTypes.object.isRequired
};

// TODO: This is duplicated in TabNavigation
function transactionTypeLabel(type) {
  switch (type) {
    case 'request':
      return 'Request';
    case 'page-load':
      return 'Page load';
    default:
      return type;
  }
}

export default TransactionOverview;
