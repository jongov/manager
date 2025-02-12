import CloseIcon from '@mui/icons-material/Close';
import { Hidden, IconButton } from '@mui/material';
import { Stack } from 'src/components/Stack';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

import { ActionMenu } from 'src/components/ActionMenu';
import { Button } from 'src/components/Button/Button';
import { CircleProgress } from 'src/components/CircleProgress';
import {
  CollapsibleTable,
  TableItem,
} from 'src/components/CollapsibleTable/CollapsibleTable';
import { InlineMenuAction } from 'src/components/InlineMenuAction/InlineMenuAction';
import { InputAdornment } from 'src/components/InputAdornment';
import { PaginationFooter } from 'src/components/PaginationFooter/PaginationFooter';
import { TableCell } from 'src/components/TableCell';
import { TableRow } from 'src/components/TableRow';
import { TableRowEmpty } from 'src/components/TableRowEmpty/TableRowEmpty';
import { TableSortCell } from 'src/components/TableSortCell';
import { TextField } from 'src/components/TextField';
import { useOrder } from 'src/hooks/useOrder';
import { usePagination } from 'src/hooks/usePagination';
import { useLoadBalancerRoutesQuery } from 'src/queries/aglb/routes';

import { RulesTable } from '../RulesTable';
import { CreateRouteDrawer } from './CreateRouteDrawer';
import { DeleteRouteDialog } from './DeleteRouteDialog';
import { DeleteRuleDialog } from './DeleteRuleDialog';
import { EditRouteDrawer } from './EditRouteDrawer';
import { RuleDrawer } from './RuleDrawer';

import type { Configuration, Filter, Route } from '@linode/api-v4';

const PREFERENCE_KEY = 'loadbalancer-routes';

interface Props {
  configuredRoutes?: Configuration['routes'];
}

export const RoutesTable = ({ configuredRoutes }: Props) => {
  const { loadbalancerId } = useParams<{ loadbalancerId: string }>();
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isAddRuleDrawerOpen, setIsAddRuleDrawerOpen] = useState(false);
  const [query, setQuery] = useState<string>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteRuleDialogOpen, setIsDeleteRuleDialogOpen] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number>();
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number>();

  const pagination = usePagination(1, PREFERENCE_KEY);

  const { handleOrderChange, order, orderBy } = useOrder(
    {
      order: 'desc',
      orderBy: 'label',
    },
    `${PREFERENCE_KEY}-order`
  );

  const filter: Filter = {
    ['+order']: order,
    ['+order_by']: orderBy,
  };

  // If the user types in a search query, API filter by the label.
  if (query) {
    filter['label'] = { '+contains': query };
  }

  /**
   * If configuredRoutes is passed, it filters the configured routes form API
   *  Otherwise, it fetches routes without filter in the routes table.
   */
  if (configuredRoutes) {
    filter['+or'] = configuredRoutes.map((route) => ({ id: route.id }));
  }

  const { data: routes, isLoading } = useLoadBalancerRoutesQuery(
    Number(loadbalancerId),
    {
      page: pagination.page,
      page_size: pagination.pageSize,
    },
    filter
  );

  const selectedRoute = routes?.data?.find(
    (route) => route.id === selectedRouteId
  );

  const onAddRule = (route: Route) => {
    setIsAddRuleDrawerOpen(true);
    setSelectedRouteId(route.id);
  };

  const onEditRule = (route: Route, ruleIndex: number) => {
    setIsAddRuleDrawerOpen(true);
    setSelectedRouteId(route.id);
    setSelectedRuleIndex(ruleIndex);
  };

  const onDeleteRule = (route: Route, ruleIndex: number) => {
    setIsDeleteRuleDialogOpen(true);
    setSelectedRouteId(route.id);
    setSelectedRuleIndex(ruleIndex);
  };

  const onEditRoute = (route: Route) => {
    setIsEditDrawerOpen(true);
    setSelectedRouteId(route.id);
  };

  const onDeleteRoute = (route: Route) => {
    setIsDeleteDialogOpen(true);
    setSelectedRouteId(route.id);
  };

  if (isLoading) {
    return <CircleProgress />;
  }

  const getTableItems = (): TableItem[] => {
    if (!routes?.data) {
      return [];
    }
    return routes?.data?.map((route) => {
      const OuterTableCells = (
        <>
          <Hidden smDown>
            <TableCell>{route.rules.length}</TableCell>
          </Hidden>
          <Hidden smDown>
            <TableCell>{route.protocol.toLocaleUpperCase()}</TableCell>{' '}
          </Hidden>
          <TableCell actionCell>
            {/**
             * TODO: AGLB: The Add Rule behavior should be implemented in future AGLB tickets.
             */}
            <InlineMenuAction
              actionText="Add Rule"
              onClick={() => onAddRule(route)}
            />
            {/**
             * TODO: AGLB: The Action menu behavior should be implemented in future AGLB tickets.
             */}
            <ActionMenu
              actionsList={[
                { onClick: () => onEditRoute(route), title: 'Edit' },
                { onClick: () => null, title: 'Clone Route' },
                { onClick: () => onDeleteRoute(route), title: 'Delete' },
              ]}
              ariaLabel={`Action Menu for Route ${route.label}`}
            />
          </TableCell>
        </>
      );

      const InnerTable = (
        <RulesTable
          loadbalancerId={Number(loadbalancerId)}
          onDeleteRule={(index) => onDeleteRule(route, index)}
          onEditRule={(index) => onEditRule(route, index)}
          route={route}
        />
      );

      return {
        InnerTable,
        OuterTableCells,
        id: route.id,
        label: route.label,
      };
    });
  };

  const RoutesTableRowHead = (
    <TableRow>
      <TableSortCell
        active={orderBy === 'label'}
        direction={order}
        handleClick={handleOrderChange}
        label="label"
      >
        Route Label
      </TableSortCell>
      <Hidden smDown>
        <TableCell>Rules</TableCell>
      </Hidden>
      <Hidden smDown>
        <TableSortCell
          active={orderBy === 'protocol'}
          direction={order}
          handleClick={handleOrderChange}
          label="protocol"
        >
          Protocol
        </TableSortCell>
      </Hidden>
      <TableCell></TableCell>
    </TableRow>
  );

  return (
    <>
      <Stack
        alignItems="flex-end"
        direction="row"
        flexWrap="wrap"
        gap={2}
        justifyContent="space-between"
        mb={2}
        mt={1.5}
      >
        <TextField
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="Clear"
                  onClick={() => setQuery('')}
                  size="small"
                  sx={{ padding: 'unset' }}
                >
                  <CloseIcon
                    color="inherit"
                    sx={{ color: '#aaa !important' }}
                  />
                </IconButton>
              </InputAdornment>
            ),
          }}
          hideLabel
          label="Filter"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter"
          style={{ minWidth: '320px' }}
          value={query}
        />
        {/**
         * TODO: AGLB: The Create Route behavior should be implemented in future AGLB tickets.
         */}
        <Button
          buttonType="primary"
          onClick={() => setIsCreateDrawerOpen(true)}
        >
          Create Route
        </Button>
      </Stack>
      <CollapsibleTable
        TableItems={getTableItems()}
        TableRowEmpty={<TableRowEmpty colSpan={5} message={'No Routes'} />}
        TableRowHead={RoutesTableRowHead}
      />
      <PaginationFooter
        count={routes?.results ?? 0}
        handlePageChange={pagination.handlePageChange}
        handleSizeChange={pagination.handlePageSizeChange}
        page={pagination.page}
        pageSize={pagination.pageSize}
      />
      <RuleDrawer
        onClose={() => {
          setIsAddRuleDrawerOpen(false);
          setSelectedRuleIndex(undefined);
        }}
        loadbalancerId={Number(loadbalancerId)}
        open={isAddRuleDrawerOpen}
        route={selectedRoute}
        ruleIndexToEdit={selectedRuleIndex}
      />
      <EditRouteDrawer
        loadbalancerId={Number(loadbalancerId)}
        onClose={() => setIsEditDrawerOpen(false)}
        open={isEditDrawerOpen}
        route={selectedRoute}
      />
      <CreateRouteDrawer
        loadbalancerId={Number(loadbalancerId)}
        onClose={() => setIsCreateDrawerOpen(false)}
        open={isCreateDrawerOpen}
      />
      <DeleteRouteDialog
        loadbalancerId={Number(loadbalancerId)}
        onClose={() => setIsDeleteDialogOpen(false)}
        open={isDeleteDialogOpen}
        route={selectedRoute}
      />
      <DeleteRuleDialog
        loadbalancerId={Number(loadbalancerId)}
        onClose={() => setIsDeleteRuleDialogOpen(false)}
        open={isDeleteRuleDialogOpen}
        route={selectedRoute}
        ruleIndex={selectedRuleIndex}
      />
    </>
  );
};
