<?php get_header(); ?>

<section id="stage">
	<div class="limiter">

		<?php get_template_part('section', 'subheader'); ?>

		<?php
		// Display latest (featured) map group
		query_posts('post_type=map-group&posts_per_page=1');
			if(have_posts()) : ?>
				<?php
				while(have_posts()) : the_post();
					get_template_part('content', 'map-group');
				endwhile;
				?>
		<?php
		endif;
		wp_reset_query();
		?>
	</div>
</section>

<section id="content">
	<div class="limiter">

		<?php get_search_form(); ?>

		<?php $highlight = false; ?>

		<?php if(is_front_page() && !is_paged()) : ?>

			<?php query_posts(array('meta_key' => 'featured')); if(have_posts()) : $highlight = true; ?>

				<section id="highlights" class="loop-section">
					<h3><?php _e('Highlights', 'infoamazonia'); ?></h3>
					<?php get_template_part('loop'); ?>
				</section>

				<?php get_template_part('section', 'submit-call'); ?>

			<?php endif; wp_reset_query(); ?>

		<?php endif; ?>

		<?php if(have_posts()) : ?>

			<section id="last-stories" class="loop-section">
				<?php if(is_front_page()) : ?>
					<h3><?php _e('Last stories', 'infoamazonia'); ?></h3>
				<?php else : ?>
					<h3><?php _e('Stories', 'infoamazonia'); ?></h3>
				<?php endif; ?>
				<?php get_template_part('loop'); ?>
			</section>

		<?php endif; ?>

		<?php if(!$highlight) get_template_part('section', 'submit-call'); ?>

	</div>
</section>
<?php if(is_active_sidebar('main-sidebar')) : ?>
	<aside id="main-widgets">
		<div class="limiter clearfix">
			<ul class="widgets">
				<?php dynamic_sidebar('main-sidebar'); ?>
			</ul>
		</div>
	</aside>
<?php endif; ?>

<?php get_footer(); ?>