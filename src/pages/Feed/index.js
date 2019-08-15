import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList } from 'react-native';

import LazyImage from '../../components/LazyImage';

import {
  Post, Header, Avatar, Name, Description, Loading,
} from './styles';


export default function Feed() {
  const [feed, setFeed] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewable, setViewable] = useState([]);

  async function loadPage(pageNumber = page, shouldRefresh = false) {
    if (total && pageNumber > total) return;

    setLoading(true);

    const response = await fetch(
      `http://localhost:3000/feed?_expand=author&_limit=5&_page=${ pageNumber }`,
    );

    const data = await response.json();
    const totalItems = response.headers.get('X-Total-Count');

    setTotal(Math.floor(totalItems / 5));
    setFeed(shouldRefresh ? data : [...feed, ...data]);
    setPage(pageNumber + 1);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  async function refreshList() {
    setRefreshing(true);

    loadPage(1, true);

    setRefreshing(false);
  }

  // Função estática que não é recriada feita com o Hook useCallback, pois o FlatList exige em onViewableItemsChanged que a função nunca seja recriada quando o estado de uma propriedade mudar.
  const handleViewableChanged = useCallback(({ changed }) => {
    setViewable(changed.map(({ item }) => item.id));
  }, []);

  return (
    <View>
      <FlatList
        data={ feed }
        keyExtractor={ post => String(post.id) }

        // Função executada quando o usuário chegar no final da lista.
        onEndReached={ () => loadPage() }

        // Percentual em relação ao final da lista em que a função será executada.
        onEndReachedThreshold={ 0.1 }

        // Qual a ação irá acontecer quando o usuário puxar a lista para baixo para forçar o recarregamento das informações.
        onRefresh={ refreshList }

        // Informação sobre quando a lista está na situação de refresh ou já terminou.
        refreshing={ refreshing }

        // Função disparada para quando os itens que estão visíveis mudarem.
        onViewableItemsChanged={ handleViewableChanged }

        // Recebe um objeto com o percentual da área do próximo item para começar a carregar a imagem.
        viewabilityConfig={ { viewAreaCoveragePercentThreshold: 20 } }

        ListFooterComponent={ loading && <Loading /> }
        renderItem={ ({ item }) => (
          <Post>
            <Header>
              <Avatar source={ { uri: item.author.avatar } } />
              <Name>{ item.author.name }</Name>
            </Header>

            <LazyImage
              shouldLoad={ viewable.includes(item.id) }
              aspectRatio={ item.aspectRatio }
              smallSource={ { uri: item.small } }
              source={ { uri: item.image } }
            />

            <Description>
              <Name>{ item.author.name }</Name> { item.description }
            </Description>
          </Post>
        ) }
      />
    </View>
  );
}
