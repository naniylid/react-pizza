import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import qs from 'qs';
import { useSelector } from 'react-redux';

import {
  selectFilterSlice,
  setCategoryId,
  setCurrentPage,
  setFilters,
} from '../redux/slices/filterSlice';
import { SearchPizzaParams, fetchPizzas, selectPizzaSlice } from '../redux/slices/pizzasSlice';
import { useAppDispatch } from '../redux/store';

//Components
import Categories from '../components/Categoties';
import Sort from '../components/Sort';
import { sortList } from '../components/Sort';
import PizzaBlock from '../components/PizzaBlock';
import Skeleton from '../components/PizzaBlock/Skeleton';
import { Pagination } from '../components/Pagination';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isSearch = React.useRef(false);
  const isMounted = React.useRef(false);

  const { categoryId, sort, currentPage, searchValue } = useSelector(selectFilterSlice);
  const { items, status } = useSelector(selectPizzaSlice);

  const sortType = sort.sortProperty;

  const onClickCategory = (id: number) => {
    dispatch(setCategoryId(id));
  };

  const onChangePage = (value: number) => {
    dispatch(setCurrentPage(value));
  };

  const getPizzas = async () => {
    const category = categoryId > 0 ? `category=${categoryId}` : '';
    const sortBy = sortType.replace('-', '');
    const order = sortType.includes('-') ? 'asc' : 'desc';
    const search = searchValue ? `search=${searchValue}` : '';

    dispatch(
      //Бизнес логика получения пицц
      fetchPizzas({
        currentPage: String(currentPage),
        category,
        sortBy,
        order,
        search,
      }),
    );
  };

  React.useEffect(() => {
    if (window.location.search) {
      const params = qs.parse(window.location.search.substring(1)) as unknown as SearchPizzaParams;
      const sort = sortList.find((obj) => obj.sortProperty === params.sortBy);

      dispatch(
        setFilters({
          searchValue: params.search,
          categoryId: Number(params.category),
          currentPage: Number(params.currentPage),
          sort: sort || sortList[0],
        }),
      );
      isSearch.current = true;
    }
  }, []);

  //Если изменили параметры и был первый рендер
  React.useEffect(() => {
    if (isMounted.current) {
      const queryString = qs.stringify({
        sortProperty: sort.sortProperty,
        categoryId,
        currentPage,
      });
      navigate(`?${queryString}`);
    }
    isMounted.current = true;
  }, [categoryId, sortType, searchValue, currentPage]);

  //Если был первый рендер, то запрашиваем пиццы
  React.useEffect(() => {
    window.scrollTo(0, 0);
    if (!isSearch.current) {
      getPizzas();
    }
    isSearch.current = false;
  }, [categoryId, sortType, searchValue, currentPage]);

  const pizzas = items.map((obj: any) => (
    <Link key={obj.id} to={`/pizza/${obj.id}`}>
      <PizzaBlock {...obj} />
    </Link>
  ));

  const skeletons = [...new Array(12)].map((_, index) => <Skeleton key={index} />);

  return (
    <div className='container'>
      <div className='content__top'>
        <Categories value={categoryId} onClickFilter={onClickCategory} />
        <Sort />
      </div>
      <h2 className='content__title'>Все пиццы</h2>
      {status === 'error' ? (
        <div>
          <h2>Ошибка загрузки. Попробуйте повторить попытку позже </h2>
        </div>
      ) : (
        <div className='content__items'>{status === 'loading' ? skeletons : pizzas}</div>
      )}
      <Pagination currentPage={currentPage} onChangePage={onChangePage} />
    </div>
  );
};
