/* eslint-disable react/no-danger */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { FaUser, FaCalendar, FaClock } from 'react-icons/fa';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: { url: string };
    author: string;
    content: {
      heading: string;
      body: { text: string }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const totalWorlds = post.data.content.reduce((total, contetItem) => {
    total += contetItem.heading.split(' ').length;
    const bodyWords = contetItem.body.map(item => item.text.split(' ').length);
    bodyWords.map(item => (total += item));
    return total;
  }, 0);

  const timeRead = Math.ceil(totalWorlds / 200);

  return (
    <>
      <header className={styles.header}>
        <img src={post.data.banner.url} alt="banner" />
      </header>
      <main>
        <div className={styles.container}>
          <div className={styles.postContainer}>
            <div className={styles.post}>
              <h1>{post.data.title}</h1>
              <time>
                <FaCalendar /> {post.first_publication_date}
              </time>
              <span>
                <FaUser /> {post.data.author}
              </span>
              <span>
                <FaClock /> {timeRead} min.
              </span>

              {post.data.content.map(item => (
                <article key={item.heading}>
                  <h2>{item.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(item.body),
                    }}
                  />
                </article>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(item => {
    return {
      params: { slug: item.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      "d ' ' MMM ' ' y",
      { locale: ptBR }
    ),
    data: {
      title: response.data.title,
      banner: { url: response.data.banner.url },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
