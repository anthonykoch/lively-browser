<template>
  <div>
    <app-site-header></app-site-header>

    <div class="Hero">
      <figure>
        <figcaption class="Hero-description">
          Scuffka allows you to execute Javascript and see what each expression resolves to and which expressions resolve first.
        </figcaption>

        <div class="Hero-action">
          <router-link :to="{ name: 'editor' }" class="Button">Try it</router-link>
        </div>

        <div
          class="IntroVideo"
        >
          <video
            class="IntroVideo-video"
            src="~assets/videos/howitworks2.mp4"
            controls
            width="720"
            @click="togglePlayState"
          ></video>
        </div>
      </figure>

      <img
        src="~assets/images/icon.logo.vue.svg"
        alt=""
        width="260px"
        class="vuelogo"
      >
    </div>
  </div>
</template>

<script>
export default {
  components: {
    AppSiteHeader: require('@/components/SiteHeader').default,
  },

  data() {
    return {
      //
    };
  },

  methods: {
    togglePlayState() {

    },
  },
};

</script>

<style scoped lang="scss">

.vuelogo {
  display: none;
  margin: 2rem auto;
  width: 260px;

}

.Hero {
  margin-top: 3rem;
}

.Hero-title {
  letter-spacing: 1px;
  letter-spacing: 0.25px;
  font-size: 40px;
  font-weight: 300;
  letter-spacing: 1px;
  // max-width: 960px;
  margin-left: 1rem;
  margin-right: 1rem;
  margin-top: 4rem;
  padding-bottom: 1.5rem;
  text-align: center;
}

.Hero-subtitle {
  color: #9bc2d8;
  font-size: 14px;
}

.Hero-description {
  line-height: 1.8;
  margin-bottom: 1rem;
  margin-left: auto;
  margin-right: auto;
  max-width: 600px;
  text-align: center;
}

.IntroVideo {
  display: block;
  margin-left: auto;
  margin-right: auto;
  max-width: 720px;
  margin-bottom: 1rem;
}

.IntroVideo-video {
  box-shadow: 0 8px 40px -1px rgba(0,0,0,0.5);
  border-radius: 4px;
  display: block;
  max-width: 100%;
}

.Hero-action {
  text-align: center;
  margin-bottom: 2rem;
}




.Button {
  background-color: transparent;
  background-color: rgba(black, 0.1);
  border: 0;
  box-shadow: none;
  color: rgba(black, 0.7);
  cursor: pointer;
  // box-shadow: 0 2px 4px 0 rgba(black, 0.2);
  font-family: $app-button-font-family;
  border-radius: 3px;
  font-size: 12px;
  outline: 0;
  padding: 18px 28px;
  max-width: 100%;
  min-width: 260px;
  text-transform: uppercase;
  transition-duration: 300ms;
  transition-property: box-shadow;
}


</style>
