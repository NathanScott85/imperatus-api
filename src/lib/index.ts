import slugify from 'slugify';

export const formatSlug = ( text: string ): string => {
  return slugify( text, {
    replacement: '-',
    remove: /[*+~.()'"!:@#?&%]/g,
    lower: true,
    strict: true,
    trim: true,
  } );
};