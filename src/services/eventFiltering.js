// @flow
import R from 'ramda';

type FilterInput = {
  status: EventStatus,
  archiveId: string
};

const statusFilter = (filter: EventFilter): (FilterInput => boolean) => ({ status, archiveId = '' }: FilterInput): boolean => {
  switch (filter) {
    case 'all':
      return true;
    case 'current':
      return status !== 'closed';
    case 'archived':
      return !!archiveId.length;
    default:
      return true;
  }
};

type Comparator = (a: BroadcastEvent, b: BroadcastEvent) => number;
const comparator = (sorting: EventSorting): Comparator => {

  const operator = sorting.order === 'descending' ? 'gt' : 'lt';
  const sortByTypeToProp: {[type: EventSortByOption]: string} = {
    mostRecent: 'showEnded', // ???
    startDate: 'showStarted', // ???
    state: 'status',
  };

  const sortingProp = R.prop(sortByTypeToProp[sorting.sortBy]);
  return R.comparator((a: BroadcastEvent, b: BroadcastEvent): number => R[operator](sortingProp(a), sortingProp(b)));
};

const filterAndSort = ({ map, filter, sorting }: EventsState): BroadcastEvent[] =>
  R.compose(
    R.filter(statusFilter(filter)),
    R.sort(comparator(sorting)) // eslint-disable-line comma-dangle
  )(R.values(map));

module.exports = {
  filterAndSort,
};
